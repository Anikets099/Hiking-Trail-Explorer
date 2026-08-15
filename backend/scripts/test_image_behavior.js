async function testDefaultImageBehavior() {
  const cities = ['Kolhapur', 'Chikmagalur', 'Munnar', 'Tawang', 'Pachmarhi'];
  console.log('=== TESTING DYNAMIC SEARCH & DEFAULT IMAGE BEHAVIOR ===\n');

  for (const city of cities) {
    try {
      const res = await fetch(`http://localhost:5000/api/explore/search?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      console.log(`City: "${city}" -> Found ${data.count} places:`);
      (data.results || []).slice(0, 4).forEach((t) => {
        console.log(`  - ${t.name}:`);
        console.log(`      Distance: "${t.distanceFromSearchText}"`);
        console.log(`      Image: ${t.imageUrl ? t.imageUrl.substring(0, 70) + '...' : 'null (Uses default-trail.jpg fallback)'}`);
      });
      console.log('');
    } catch (e) {
      console.error(`Failed for ${city}:`, e.message);
    }
  }

  console.log('=== TEST FINISHED ===');
}

testDefaultImageBehavior();
