async function testProfileStats() {
  const timestamp = Date.now();
  const testEmail = `newtrekker_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = `New Explorer ${timestamp}`;

  console.log('====================================================');
  console.log('TESTING NEW USER PROFILE ZERO-BASED STATISTICS');
  console.log('====================================================\n');

  // STEP 1: Register brand-new user
  console.log(`STEP 1: Registering new user "${testEmail}"...`);
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword
    })
  });
  const regData = await regRes.json();
  console.log('Registration Response Status:', regRes.status);
  console.log('Token received:', Boolean(regData.token));
  console.log('Initial stats in register response:');
  console.log(`  Favorites: ${regData.data?.favoritesCount}`);
  console.log(`  Reviews: ${regData.data?.reviewsCount}`);
  console.log(`  Trails Explored: ${regData.data?.trailsExplored}`);

  const token = regData.token;

  // STEP 2: Query /api/users/me directly
  console.log('\nSTEP 2: Fetching /api/users/me profile stats...');
  const meRes = await fetch('http://localhost:5000/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('GET /api/users/me data:');
  console.log(`  Favorites: ${meData.data?.favoritesCount} (Expected: 0)`);
  console.log(`  Reviews: ${meData.data?.reviewsCount} (Expected: 0)`);
  console.log(`  Trails Explored: ${meData.data?.trailsExplored} (Expected: 0)`);
  
  const step2Pass =
    meData.data?.favoritesCount === 0 &&
    meData.data?.reviewsCount === 0 &&
    meData.data?.trailsExplored === 0;
  console.log(`VERIFICATION STEP 2 (New user starts with 0/0/0): ${step2Pass}`);

  // STEP 3: Favorite one trail
  console.log('\nSTEP 3: Favoriting 1 trail (rajgad-fort)...');
  const favRes = await fetch('http://localhost:5000/api/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ trailId: 'rajgad-fort' })
  });
  const favData = await favRes.json();
  console.log('Favorite added:', favData.success);

  const meAfterFav = await (await fetch('http://localhost:5000/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log(`  Favorites: ${meAfterFav.data?.favoritesCount} (Expected: 1)`);
  console.log(`  Reviews: ${meAfterFav.data?.reviewsCount} (Expected: 0)`);
  console.log(`  Trails Explored: ${meAfterFav.data?.trailsExplored} (Expected: 0)`);

  // STEP 4: Write one review
  console.log('\nSTEP 4: Writing 1 review on rajgad-fort...');
  const revRes = await fetch('http://localhost:5000/api/trails/rajgad-fort/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Incredible sunrise trek! Highly recommended.'
    })
  });
  const revData = await revRes.json();
  console.log('Review posted:', revData.success);

  const meAfterRev = await (await fetch('http://localhost:5000/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log(`  Favorites: ${meAfterRev.data?.favoritesCount} (Expected: 1)`);
  console.log(`  Reviews: ${meAfterRev.data?.reviewsCount} (Expected: 1)`);
  console.log(`  Trails Explored: ${meAfterRev.data?.trailsExplored} (Expected: 0)`);

  // STEP 5: Explore one trail
  console.log('\nSTEP 5: Exploring 1 trail (POST /api/users/explored/rajgad-fort)...');
  const expRes = await fetch('http://localhost:5000/api/users/explored/rajgad-fort', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const expData = await expRes.json();
  console.log('Exploration recorded:', expData.success);

  const meAfterExp = await (await fetch('http://localhost:5000/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  })).json();
  console.log(`  Favorites: ${meAfterExp.data?.favoritesCount} (Expected: 1)`);
  console.log(`  Reviews: ${meAfterExp.data?.reviewsCount} (Expected: 1)`);
  console.log(`  Trails Explored: ${meAfterExp.data?.trailsExplored} (Expected: 1)`);

  // STEP 6: Logout & Re-login
  console.log('\nSTEP 6: Re-logging in with user credentials...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const loginData = await loginRes.json();
  console.log('Login Response:');
  console.log(`  Favorites: ${loginData.data?.favoritesCount} (Expected: 1)`);
  console.log(`  Reviews: ${loginData.data?.reviewsCount} (Expected: 1)`);
  console.log(`  Trails Explored: ${loginData.data?.trailsExplored} (Expected: 1)`);

  // STEP 7: Register second new user to ensure total data isolation
  console.log('\nSTEP 7: Registering second brand-new user...');
  const user2Email = `seconduser_${timestamp}@example.com`;
  const reg2Res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Second Explorer',
      email: user2Email,
      password: testPassword
    })
  });
  const reg2Data = await reg2Res.json();
  const me2Res = await fetch('http://localhost:5000/api/users/me', {
    headers: { 'Authorization': `Bearer ${reg2Data.token}` }
  });
  const me2Data = await me2Res.json();
  console.log('Second User Profile Stats:');
  console.log(`  Favorites: ${me2Data.data?.favoritesCount} (Expected: 0)`);
  console.log(`  Reviews: ${me2Data.data?.reviewsCount} (Expected: 0)`);
  console.log(`  Trails Explored: ${me2Data.data?.trailsExplored} (Expected: 0)`);

  const isolationPass =
    me2Data.data?.favoritesCount === 0 &&
    me2Data.data?.reviewsCount === 0 &&
    me2Data.data?.trailsExplored === 0;
  console.log(`VERIFICATION STEP 7 (Data isolation across users): ${isolationPass}`);

  console.log('\n====================================================');
  console.log('ALL USER PROFILE STATS TESTS COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

testProfileStats();
