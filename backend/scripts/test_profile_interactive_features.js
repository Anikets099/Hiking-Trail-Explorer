async function testInteractiveProfile() {
  const timestamp = Date.now();
  const email = `trekker_${timestamp}@example.com`;
  const password = 'Password123!';
  const name = `Trekker ${timestamp}`;

  console.log('====================================================');
  console.log('TESTING PROFILE CLICKABLE CARDS & DATA ENDPOINTS');
  console.log('====================================================\n');

  // STEP 1: Register User
  console.log(`1. Registering user "${email}"...`);
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

  // STEP 2: Verify Initial Empty Lists
  console.log('\n2. Verifying Initial Empty Lists for New User:');
  const favs0 = await (await fetch('http://localhost:5000/api/favorites', { headers })).json();
  const revs0 = await (await fetch('http://localhost:5000/api/users/me/reviews', { headers })).json();
  const expl0 = await (await fetch('http://localhost:5000/api/users/me/explored', { headers })).json();

  console.log(`   Favorites list count: ${favs0.data?.length} (Expected: 0)`);
  console.log(`   Reviews list count: ${revs0.data?.length} (Expected: 0)`);
  console.log(`   Explored list count: ${expl0.data?.length} (Expected: 0)`);

  // STEP 3: Add Trail to Favorites
  console.log('\n3. Adding "rajgad-fort" to Favorites...');
  const addFav = await (await fetch('http://localhost:5000/api/favorites/rajgad-fort', {
    method: 'POST',
    headers
  })).json();
  console.log('   Favorite added successfully:', addFav.success);

  const favs1 = await (await fetch('http://localhost:5000/api/favorites', { headers })).json();
  console.log(`   Favorites list count: ${favs1.data?.length}`);
  console.log(`   Favorite Trail Details:`);
  console.log(`     - Name: "${favs1.data[0]?.name}"`);
  console.log(`     - Location: "${favs1.data[0]?.location}"`);
  console.log(`     - Difficulty: "${favs1.data[0]?.difficulty}"`);
  console.log(`     - Distance: "${favs1.data[0]?.distance}"`);
  console.log(`     - Image: "${favs1.data[0]?.imageUrl || favs1.data[0]?.image}"`);

  // STEP 4: Post Review
  console.log('\n4. Writing review on "rajgad-fort"...');
  const addRev = await (await fetch('http://localhost:5000/api/trails/rajgad-fort/reviews', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      rating: 5,
      comment: 'Super scenic trail with great mountain breeze!'
    })
  })).json();
  console.log('   Review created:', addRev.success);

  const revs1 = await (await fetch('http://localhost:5000/api/users/me/reviews', { headers })).json();
  console.log(`   User Reviews list count: ${revs1.data?.length}`);
  console.log(`   Review Details:`);
  console.log(`     - Trail Name: "${revs1.data[0]?.trail?.name}"`);
  console.log(`     - Rating: ${revs1.data[0]?.rating} Stars`);
  console.log(`     - Comment: "${revs1.data[0]?.comment}"`);
  console.log(`     - Date: "${revs1.data[0]?.createdAt}"`);
  console.log(`     - Trail Image: "${revs1.data[0]?.trail?.imageUrl || revs1.data[0]?.trail?.image}"`);

  // STEP 5: Record Explored Trail
  console.log('\n5. Recording explored trail ("rajgad-fort")...');
  const addExpl = await (await fetch('http://localhost:5000/api/users/explored/rajgad-fort', {
    method: 'POST',
    headers
  })).json();
  console.log('   Explored record saved:', addExpl.success);

  const expl1 = await (await fetch('http://localhost:5000/api/users/me/explored', { headers })).json();
  console.log(`   Explored Trails list count: ${expl1.data?.length}`);
  console.log(`   Explored Trail Details:`);
  console.log(`     - Trail Name: "${expl1.data[0]?.name}"`);
  console.log(`     - Location: "${expl1.data[0]?.location}"`);
  console.log(`     - Difficulty: "${expl1.data[0]?.difficulty}"`);
  console.log(`     - Explored Date: "${expl1.data[0]?.exploredAt}"`);
  console.log(`     - Trail Image: "${expl1.data[0]?.imageUrl || expl1.data[0]?.image}"`);

  // STEP 6: Verify Profile Stats Counts
  console.log('\n6. Fetching /api/users/me for updated profile statistics:');
  const profile = await (await fetch('http://localhost:5000/api/users/me', { headers })).json();
  console.log(`   Favorites Count: ${profile.data?.favoritesCount} (Expected: 1)`);
  console.log(`   Reviews Count: ${profile.data?.reviewsCount} (Expected: 1)`);
  console.log(`   Trails Explored Count: ${profile.data?.trailsExplored} (Expected: 1)`);

  const passed =
    favs1.data?.length === 1 &&
    revs1.data?.length === 1 &&
    expl1.data?.length === 1 &&
    profile.data?.favoritesCount === 1 &&
    profile.data?.reviewsCount === 1 &&
    profile.data?.trailsExplored === 1;

  console.log('\n====================================================');
  console.log(`PROFILE INTERACTIVE FEATURES TEST RESULT: ${passed ? 'PASSED' : 'FAILED'}`);
  console.log('====================================================');
}

testInteractiveProfile();
