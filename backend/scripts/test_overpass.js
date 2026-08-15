const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

async function test() {
  const lat = 16.7028;
  const lon = 74.2405;
  const radius = 30000;

  const query = `[out:json][timeout:15];
(
  node["natural"="peak"](around:${radius},${lat},${lon});
  node["historic"="fort"](around:${radius},${lat},${lon});
  node["tourism"="viewpoint"](around:${radius},${lat},${lon});
  node["tourism"="attraction"](around:${radius},${lat},${lon});
  way["highway"="path"]["name"](around:${radius},${lat},${lon});
  way["highway"="track"]["name"](around:${radius},${lat},${lon});
  relation["route"="hiking"](around:${radius},${lat},${lon});
);
out center 30;`;

  for (const ep of endpoints) {
    console.log('Testing endpoint:', ep);
    const start = Date.now();
    try {
      const res = await fetch(ep, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'TrailExplorer/1.0 (student-project)'
        }
      });
      const time = Date.now() - start;
      console.log(ep, 'Status:', res.status, 'Time:', time + 'ms');
      if (res.ok) {
        const json = await res.json();
        console.log('Elements count:', json.elements?.length);
        const names = json.elements?.map(e => e.tags?.name).filter(Boolean);
        console.log('Names:', names);
        break;
      }
    } catch (e) {
      console.log(ep, 'Error:', e.message);
    }
  }
}

test();
