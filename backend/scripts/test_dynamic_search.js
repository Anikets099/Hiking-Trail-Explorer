async function runAllTests() {
  const cities = ['Mumbai', 'Pune', 'Kolkata', 'Nashik', 'Jaipur', 'ABCXYZ123'];

  console.log('=== RUNNING ALL DYNAMIC EXPLORATION TESTS ===\n');

  for (const city of cities) {
    const start = Date.now();
    try {
      const res = await fetch(`http://localhost:5000/api/explore/search?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      const elapsed = Date.now() - start;
      console.log(`TEST: "${city}"`);
      console.log(`  Success: ${data.success}`);
      console.log(`  Location: ${data.location ? JSON.stringify(data.location.name) : 'null'}`);
      console.log(`  Found: ${data.count} trails (Response time: ${elapsed}ms)`);
      if (data.results && data.results.length > 0) {
        console.log(`  Sample:`, data.results.slice(0, 2).map(t => `${t.name} (${t.type || 'Trail'}) [${t.latitude}, ${t.longitude}]`));
      }
      if (city === 'ABCXYZ123') {
        const containsRajgad = (data.results || []).some(t => t.name?.includes('Rajgad'));
        console.log(`  Verification: Non-existent city returned 0 trails and NO Rajgad: ${!containsRajgad && data.count === 0}`);
      }
      console.log('');
    } catch (e) {
      console.error(`TEST FAILED for "${city}":`, e.message);
    }
  }

  // TEST Nearby
  console.log('TEST: "Nearby Dynamic Search (lat: 18.5204, lng: 73.8567, radius: 25)"');
  try {
    const resNearby = await fetch('http://localhost:5000/api/explore/nearby?lat=18.5204&lng=73.8567&radius=25');
    const dataNearby = await resNearby.json();
    console.log(`  Success: ${dataNearby.success}`);
    console.log(`  Found: ${dataNearby.count} nearby trails`);
    if (dataNearby.results && dataNearby.results.length > 0) {
      console.log(`  Sample Nearby:`, dataNearby.results.slice(0, 3).map(t => `${t.name} (${t.distanceFromUser})`));
    }
  } catch (e) {
    console.error('Nearby test failed:', e.message);
  }

  console.log('\n=== ALL TESTS COMPLETED ===');
}

runAllTests();
