/**
 * Wikimedia Commons MediaWiki API Integration Service
 * Dynamically searches Wikimedia Commons (and Wikipedia) for authentic trail & place photographs
 * without requiring any API keys.
 * 
 * Strict quality policy:
 * - Checks title/description relevance against trail name tokens.
 * - Excludes maps, logos, icons, flags, diagrams, and portraits.
 * - Returns null when no sufficiently relevant image is found.
 * - Never uses hardcoded or forced fallbacks (e.g. no Rajgad, Pune, or Mumbai defaults).
 */

// In-memory cache for Wikimedia image lookups (24-hour TTL)
const imageCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const USER_AGENT = 'HikingTrailExplorer/2.0 (student-project; open-education-use; contact: student.trailexplorer@gmail.com)';

const EXCLUDED_TITLE_KEYWORDS = [
  'map',
  'plan',
  'diagram',
  'icon',
  'logo',
  'flag',
  'symbol',
  'seal',
  'coat of arms',
  'schema',
  'route map',
  'portrait',
  'monument plaque',
  'stamp'
];

/**
 * Checks if a Wikimedia file title is relevant to the searched place name
 */
function isFileTitleRelevant(fileTitle, placeName) {
  if (!fileTitle || !placeName) return false;

  const lowerTitle = fileTitle.toLowerCase().replace(/^file:/, '').replace(/\.[a-z0-9]+$/, '');
  const lowerPlace = placeName.toLowerCase().trim();

  // Exclude unwanted file types
  if (EXCLUDED_TITLE_KEYWORDS.some((kw) => lowerTitle.includes(kw))) {
    return false;
  }

  // Tokenize place name into significant words (3+ chars)
  const placeTokens = lowerPlace
    .split(/[\s,_\-–—/()]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !['fort', 'peak', 'hill', 'point', 'view', 'trail', 'temple', 'park', 'road'].includes(t));

  // If we have specific place tokens, require at least one to be in the image title
  if (placeTokens.length > 0) {
    return placeTokens.some((token) => lowerTitle.includes(token));
  }

  // Fallback check against full name
  const cleanBase = lowerPlace.replace(/fort|peak|hill|point|viewpoint|temple|park/g, '').trim();
  return cleanBase.length >= 3 ? lowerTitle.includes(cleanBase) : true;
}

/**
 * Searches Wikimedia Commons for an image matching the query (trail name + city)
 * @param {string} trailName - Name of the trail/place
 * @param {string} city - Optional city/region name
 * @returns {Promise<Object>} Object containing imageUrl or null
 */
async function searchWikimediaImage(trailName, city = '') {
  try {
    const cleanName = (trailName || '').trim();
    if (!cleanName) {
      return getEmptyImageResult();
    }

    const cacheKey = `${cleanName.toLowerCase()}_${(city || '').toLowerCase()}`;
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // 1. Primary: Search Wikimedia Commons File namespace (gsrnamespace=6) for trail name
    let result = await queryCommonsFileSearch(cleanName);

    // 2. Secondary: If no match and city provided, try with "trailName city"
    if (!result && city && city.trim()) {
      result = await queryCommonsFileSearch(`${cleanName} ${city.trim()}`);
    }

    // 3. Tertiary: Try Wikipedia pageimages search for landmarks/peaks/forts
    if (!result) {
      result = await queryWikipediaPageImage(cleanName);
    }

    const finalResult = result || getEmptyImageResult();

    // Cache the result
    imageCache.set(cacheKey, {
      data: finalResult,
      timestamp: Date.now()
    });

    return finalResult;
  } catch (err) {
    console.warn(`Wikimedia lookup error for "${trailName}": ${err.message}`);
    return getEmptyImageResult();
  }
}

/**
 * Query Wikimedia Commons using generator=search with File namespace
 */
async function queryCommonsFileSearch(searchTerm) {
  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      searchTerm
    )}&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata|user&iiurlwidth=800&format=json&origin=*`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages || Object.keys(pages).length === 0) return null;

    const pageList = Object.values(pages);

    // Find the first relevant image file
    const matchedPage = pageList.find((p) => {
      const title = p.title || '';
      const ext = title.split('.').pop().toLowerCase();
      const isImg = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
      if (!isImg) return false;
      return isFileTitleRelevant(title, searchTerm);
    });

    if (!matchedPage) return null;

    const imageInfo = matchedPage.imageinfo?.[0];
    if (!imageInfo || (!imageInfo.thumburl && !imageInfo.url)) return null;

    const extmeta = imageInfo.extmetadata || {};
    const author =
      extmeta.Artist?.value?.replace(/<[^>]*>?/gm, '') || imageInfo.user || 'Wikimedia Commons Contributor';
    const license = extmeta.LicenseShortName?.value || 'CC BY-SA';
    const sourceUrl =
      imageInfo.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(matchedPage.title)}`;

    const url = imageInfo.thumburl || imageInfo.url;

    return {
      imageUrl: url,
      thumbnailUrl: url,
      imageAuthor: author.substring(0, 80),
      imageLicense: license,
      sourceUrl: sourceUrl,
      imageAttribution: `Photo by ${author.substring(0, 60)} (${license}) via Wikimedia Commons`
    };
  } catch (e) {
    return null;
  }
}

/**
 * Fallback to Wikipedia PageImage search
 */
async function queryWikipediaPageImage(searchTerm) {
  try {
    const endpoint = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      searchTerm
    )}&gsrlimit=3&prop=pageimages&piprop=thumbnail|original&pithumbsize=800&format=json&origin=*`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const pageList = Object.values(pages);
    const matched = pageList.find((p) => {
      if (!p.thumbnail?.source) return false;
      return isFileTitleRelevant(p.title, searchTerm);
    });

    if (!matched || !matched.thumbnail?.source) return null;

    return {
      imageUrl: matched.thumbnail.source,
      thumbnailUrl: matched.thumbnail.source,
      imageAuthor: 'Wikipedia Contributor',
      imageLicense: 'CC BY-SA',
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(matched.title)}`,
      imageAttribution: `Image via Wikipedia (${matched.title})`
    };
  } catch (e) {
    return null;
  }
}

/**
 * Returns null representation when no image is found (Frontend renders clean placeholder)
 */
function getEmptyImageResult() {
  return {
    imageUrl: null,
    thumbnailUrl: null,
    imageAuthor: null,
    imageLicense: null,
    sourceUrl: null,
    imageAttribution: null
  };
}

module.exports = {
  searchWikimediaImage,
  isFileTitleRelevant
};
