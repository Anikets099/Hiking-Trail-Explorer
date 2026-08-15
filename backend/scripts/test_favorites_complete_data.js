async function testFavoritesCompleteData() {
  const timestamp = Date.now();
  const email = `favuser_${timestamp}@example.com`;
  const password = 'Password123!';
  const name = `Fav Explorer ${timestamp}`;

  console.log('====================================================');
  console.log('TESTING COMPLETE FAVORITES PERSISTENCE ACROSS CITIES');
  console.log('====================================================\n');

  // 1. Register User
  console.log(`1. Registering test user "${email}"...`);
  const regRes = await (await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })).json();

  const token = regRes.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Search Goa & favorite 1st result
  console.log('\n2. Searching "Goa" and saving 1st trail to favorites...');
  const goaSearch = await (await fetch('http://localhost:5000/api/explore/search?city=Goa')).json();
  const goaTrail = goaSearch.results[0];
  console.log(`   Found Goa trail: "${goaTrail.name}" (ID: ${goaTrail.id}, Image: ${goaTrail.imageUrl ? goaTrail.imageUrl.substring(0, 40) + '...' : 'null'})`);

  const saveGoa = await (await fetch(`http://localhost:5000/api/favorites/${goaTrail.id}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(goaTrail)
  })).json();
  console.log('   Goa favorite save status:', saveGoa.success);

  // 3. Search Chikmagalur & favorite Mullayyanagiri
  console.log('\n3. Searching "Chikmagalur" and saving "Mullayyanagiri" to favorites...');
  const chikSearch = await (await fetch('http://localhost:5000/api/explore/search?city=Chikmagalur')).json();
  const chikTrail = chikSearch.results.find(t => t.name.toLowerCase().includes('mullayyanagiri')) || chikSearch.results[0];
  console.log(`   Found Chikmagalur trail: "${chikTrail.name}" (ID: ${chikTrail.id}, Image: ${chikTrail.imageUrl ? chikTrail.imageUrl.substring(0, 40) + '...' : 'null'})`);

  const saveChik = await (await fetch(`http://localhost:5000/api/favorites/${chikTrail.id}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(chikTrail)
  })).json();
  console.log('   Chikmagalur favorite save status:', saveChik.success);

  // 4. Search Kolhapur & favorite 1st result
  console.log('\n4. Searching "Kolhapur" and saving 1st trail to favorites...');
  const kolSearch = await (await fetch('http://localhost:5000/api/explore/search?city=Kolhapur')).json();
  const kolTrail = kolSearch.results[0];
  console.log(`   Found Kolhapur trail: "${kolTrail.name}" (ID: ${kolTrail.id}, Image: ${kolTrail.imageUrl ? kolTrail.imageUrl.substring(0, 40) + '...' : 'null'})`);

  const saveKol = await (await fetch(`http://localhost:5000/api/favorites/${kolTrail.id}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(kolTrail)
  })).json();
  console.log('   Kolhapur favorite save status:', saveKol.success);

  // 5. Fetch Favorites List
  console.log('\n5. Fetching /api/favorites from MongoDB:');
  const favsRes = await (await fetch('http://localhost:5000/api/favorites', { headers })).json();
  console.log(`   Total Favorites Count: ${favsRes.data?.length}`);

  let noOsmNames = true;
  let specificLocations = true;

  favsRes.data.forEach((fav, i) => {
    console.log(`\n   Favorite #${i + 1}:`);
    console.log(`     - Name: "${fav.name}"`);
    console.log(`     - Location: "${fav.location}"`);
    console.log(`     - City: "${fav.city}"`);
    console.log(`     - Difficulty: "${fav.difficulty}"`);
    console.log(`     - Distance: "${fav.distance}"`);
    console.log(`     - Elevation: "${fav.elevation}"`);
    console.log(`     - Rating: ${fav.rating} ★`);
    console.log(`     - Image: "${fav.imageUrl || fav.image}"`);

    if (/^osm\s*node/i.test(fav.name) || /^osm-node/i.test(fav.name)) {
      noOsmNames = false;
    }
    if (fav.location === 'India' || fav.location === '[object Object]') {
      specificLocations = false;
    }
  });

  console.log(`\n   VERIFICATION: No "Osm node..." names: ${noOsmNames}`);
  console.log(`   VERIFICATION: Specific non-generic locations: ${specificLocations}`);
  console.log(`   VERIFICATION: All 3 distinct trails saved: ${favsRes.data.length === 3}`);

  // 6. Remove 1 Favorite (e.g. Goa trail)
  console.log(`\n6. Removing Goa trail ("${goaTrail.name}") from favorites...`);
  const remRes = await (await fetch(`http://localhost:5000/api/favorites/${goaTrail.id}`, {
    method: 'DELETE',
    headers
  })).json();
  console.log('   Remove status:', remRes.success);

  const favsAfterRem = await (await fetch('http://localhost:5000/api/favorites', { headers })).json();
  console.log(`   Favorites count after remove: ${favsAfterRem.data?.length} (Expected: 2)`);
  const goaStillExists = favsAfterRem.data.some(f => f.name === goaTrail.name || f.id === goaTrail.id);
  console.log(`   Goa trail completely removed: ${!goaStillExists}`);

  // 7. Profile Stats Count
  console.log('\n7. Fetching /api/users/me for updated profile statistics:');
  const me = await (await fetch('http://localhost:5000/api/users/me', { headers })).json();
  console.log(`   Favorites Count in Profile: ${me.data?.favoritesCount} (Expected: 2)`);

  const allPassed =
    noOsmNames &&
    specificLocations &&
    favsRes.data.length === 3 &&
    favsAfterRem.data.length === 2 &&
    !goaStillExists &&
    me.data?.favoritesCount === 2;

  console.log('\n====================================================');
  console.log(`FAVORITES COMPLETE DATA TEST: ${allPassed ? 'PASSED' : 'FAILED'}`);
  console.log('====================================================');
}

testFavoritesCompleteData();
