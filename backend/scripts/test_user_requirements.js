async function runValidation() {
  console.log('====================================================');
  console.log('RUNNING VALIDATION FOR ALL 5 USER TEST CASES');
  console.log('====================================================\n');

  // TEST 1: Search Chikmagalur
  console.log('--- TEST 1: Search "Chikmagalur" ---');
  try {
    const res1 = await fetch('http://localhost:5000/api/explore/search?city=Chikmagalur');
    const d1 = await res1.json();
    console.log(`Success: ${d1.success}`);
    console.log(`Search Location: ${d1.searchLocation?.name} [${d1.searchLocation?.latitude}, ${d1.searchLocation?.longitude}]`);
    console.log(`Found Trails Count: ${d1.count}`);
    
    if (d1.results && d1.results.length > 0) {
      console.log('Discovered Trails:');
      d1.results.slice(0, 5).forEach((t) => {
        console.log(`  - ${t.name}:`);
        console.log(`      Distance B: "${t.distanceFromSearchText || t.distanceFromSearch}"`);
        console.log(`      Image URL: ${t.imageUrl ? t.imageUrl.substring(0, 75) + '...' : 'null (Clean Placeholder)'}`);
        console.log(`      Has Rajgad Image: ${Boolean(t.imageUrl && t.imageUrl.includes('rajgad'))}`);
      });
    }

    const hasAnyRajgad = (d1.results || []).some(t => t.imageUrl && t.imageUrl.includes('rajgad'));
    console.log(`VERIFICATION 1 (No Rajgad default image): ${!hasAnyRajgad}`);
    console.log(`VERIFICATION 1 (Distance from Chikmagalur): ${(d1.results || []).every(t => !t.distanceFromSearchText || t.distanceFromSearchText.includes('Chikmagalur'))}`);
  } catch (e) {
    console.error('TEST 1 Failed:', e.message);
  }
  console.log('\n');

  // TEST 2: Search Chikmagalur + User GPS (e.g. Pune userLat=18.5204, userLng=73.8567)
  console.log('--- TEST 2: Search "Chikmagalur" + "Use My Location" (Pune GPS: 18.52, 73.85) ---');
  try {
    const res2 = await fetch('http://localhost:5000/api/explore/search?city=Chikmagalur&userLat=18.5204&userLng=73.8567');
    const d2 = await res2.json();
    console.log(`Success: ${d2.success}`);
    console.log(`User Location: [${d2.userLocation?.latitude}, ${d2.userLocation?.longitude}]`);
    console.log(`Search Location: ${d2.searchLocation?.name}`);
    console.log(`DISTANCE A (User -> Search): ${d2.distanceFromUserToSearchText || d2.distanceFromUserToSearch}`);
    
    if (d2.results && d2.results.length > 0) {
      console.log('Sample Trail Distances (DISTANCE B):');
      d2.results.slice(0, 3).forEach((t) => {
        console.log(`  - ${t.name}: "${t.distanceFromSearchText}" (Calculated from ${d2.searchLocation?.name}, NOT 500+ km from user!)`);
      });
    }

    const correctSeparation = d2.distanceFromUserToSearchKm > 400 &&
      d2.results.every(t => t.distanceFromSearchKm == null || t.distanceFromSearchKm < 100);
    console.log(`VERIFICATION 2 (Two Distances Kept Completely Separate): ${correctSeparation}`);
  } catch (e) {
    console.error('TEST 2 Failed:', e.message);
  }
  console.log('\n');

  // TEST 3: Search Munnar
  console.log('--- TEST 3: Search "Munnar" ---');
  try {
    const res3 = await fetch('http://localhost:5000/api/explore/search?city=Munnar');
    const d3 = await res3.json();
    console.log(`Success: ${d3.success}`);
    console.log(`Search Location: ${d3.searchLocation?.name}`);
    console.log(`Found: ${d3.count} trails`);
    if (d3.results && d3.results.length > 0) {
      d3.results.slice(0, 3).forEach((t) => {
        console.log(`  - ${t.name}: "${t.distanceFromSearchText}" | Image: ${t.imageUrl ? t.imageUrl.substring(0, 60) + '...' : 'null'}`);
      });
    }
  } catch (e) {
    console.error('TEST 3 Failed:', e.message);
  }
  console.log('\n');

  // TEST 4: Search Tawang
  console.log('--- TEST 4: Search "Tawang" ---');
  try {
    const res4 = await fetch('http://localhost:5000/api/explore/search?city=Tawang');
    const d4 = await res4.json();
    console.log(`Success: ${d4.success}`);
    console.log(`Search Location: ${d4.searchLocation?.name}`);
    console.log(`Found: ${d4.count} trails`);
    if (d4.results && d4.results.length > 0) {
      d4.results.slice(0, 3).forEach((t) => {
        console.log(`  - ${t.name}: "${t.distanceFromSearchText}" | Image: ${t.imageUrl ? t.imageUrl.substring(0, 60) + '...' : 'null'}`);
      });
    }
  } catch (e) {
    console.error('TEST 4 Failed:', e.message);
  }
  console.log('\n');

  // TEST 5: Search Kolhapur
  console.log('--- TEST 5: Search "Kolhapur" ---');
  try {
    const res5 = await fetch('http://localhost:5000/api/explore/search?city=Kolhapur');
    const d5 = await res5.json();
    console.log(`Success: ${d5.success}`);
    console.log(`Search Location: ${d5.searchLocation?.name}`);
    console.log(`Found: ${d5.count} trails`);
    if (d5.results && d5.results.length > 0) {
      d5.results.slice(0, 3).forEach((t) => {
        console.log(`  - ${t.name}: "${t.distanceFromSearchText}" | Image: ${t.imageUrl ? t.imageUrl.substring(0, 60) + '...' : 'null'}`);
      });
    }
  } catch (e) {
    console.error('TEST 5 Failed:', e.message);
  }

  console.log('\n====================================================');
  console.log('ALL VALIDATION TESTS COMPLETE');
  console.log('====================================================');
}

runValidation();
