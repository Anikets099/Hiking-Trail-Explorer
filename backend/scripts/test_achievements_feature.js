async function testAchievementsFeature() {
  const timestamp = Date.now();
  const emailA = `achieverA_${timestamp}@example.com`;
  const emailB = `achieverB_${timestamp}@example.com`;
  const password = 'Password123!';

  console.log('====================================================');
  console.log('TESTING ACHIEVEMENTS & COMPLETED TRAILS FEATURE');
  console.log('====================================================\n');

  // 1. Register User A
  console.log(`1. Registering User A: "${emailA}"...`);
  const regARes = await (await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Explorer Alice', email: emailA, password })
  })).json();

  const tokenA = regARes.token;
  const headersA = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenA}`
  };

  // 2. Verify Initial Empty Achievements
  console.log('\n2. Verifying initial zero achievements for User A...');
  const initCompA = await (await fetch('http://localhost:5000/api/completions', { headers: headersA })).json();
  console.log(`   Initial completed count: ${initCompA.totalCompleted} (Expected: 0)`);
  console.log(`   All badges locked: ${initCompA.badges?.every(b => !b.unlocked)}`);

  // 3. Search Goa and mark 1st trail as completed
  console.log('\n3. Searching "Goa" dynamic trails and marking 1st trail completed...');
  const goaSearch = await (await fetch('http://localhost:5000/api/explore/search?city=Goa')).json();
  const goaTrail = goaSearch.results[0];
  console.log(`   Found Goa trail: "${goaTrail.name}" (ID: ${goaTrail.id})`);

  const mark1 = await (await fetch(`http://localhost:5000/api/completions/${goaTrail.id}`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify(goaTrail)
  })).json();
  console.log(`   Mark completed response status: ${mark1.success}, completed: ${mark1.completed}`);

  // 4. Check status endpoint
  console.log('\n4. Checking completion status via /api/completions/check/:trailId...');
  const checkStatus = await (await fetch(`http://localhost:5000/api/completions/check/${goaTrail.id}`, { headers: headersA })).json();
  console.log(`   Check status completed: ${checkStatus.completed} (Expected: true)`);

  // 5. Test Duplicate Prevention
  console.log('\n5. Attempting duplicate mark on the same trail...');
  const markDup = await (await fetch(`http://localhost:5000/api/completions/${goaTrail.id}`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify(goaTrail)
  })).json();
  console.log(`   Duplicate attempt result: ${markDup.message}`);

  const compAfterDup = await (await fetch('http://localhost:5000/api/completions', { headers: headersA })).json();
  console.log(`   Total completions after duplicate attempt: ${compAfterDup.totalCompleted} (Expected: 1)`);

  // 6. Complete 4 more trails to reach 5 total completions
  console.log('\n6. Completing 4 additional trails to unlock "Explorer" milestone...');
  const additionalTrails = goaSearch.results.slice(1, 5);

  for (const t of additionalTrails) {
    if (t) {
      await fetch(`http://localhost:5000/api/completions/${t.id}`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify(t)
      });
      console.log(`   Marked completed: "${t.name}" (${t.city || 'Goa'})`);
    }
  }


  // 7. Verify Unlocked Badges for User A
  console.log('\n7. Fetching /api/completions for updated badges & completed list:');
  const comp5Res = await (await fetch('http://localhost:5000/api/completions', { headers: headersA })).json();
  console.log(`   Total Completed Trails: ${comp5Res.totalCompleted} (Expected: 5)`);

  console.log('\n   Badge Statuses:');
  comp5Res.badges?.forEach((b) => {
    console.log(`     - [${b.unlocked ? 'UNLOCKED ✓' : 'LOCKED  '}] ${b.icon} ${b.title} (${b.progress}/${b.requiredCount})`);
  });

  const firstAdv = comp5Res.badges?.find(b => b.id === 'first-adventure');
  const explorerBadge = comp5Res.badges?.find(b => b.id === 'explorer');
  const mtnTrekkerBadge = comp5Res.badges?.find(b => b.id === 'mountain-trekker');

  console.log(`\n   "First Adventure" Unlocked: ${firstAdv?.unlocked} (Expected: true)`);
  console.log(`   "Explorer" Unlocked: ${explorerBadge?.unlocked} (Expected: true)`);
  console.log(`   "Mountain Trekker" Unlocked: ${mtnTrekkerBadge?.unlocked} (Expected: false)`);

  // 8. Register User B & Verify User Isolation
  console.log(`\n8. Registering User B: "${emailB}" to verify data isolation...`);
  const regBRes = await (await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Explorer Bob', email: emailB, password })
  })).json();

  const headersB = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${regBRes.token}`
  };

  const compBRes = await (await fetch('http://localhost:5000/api/completions', { headers: headersB })).json();
  console.log(`   User B completions count: ${compBRes.totalCompleted} (Expected: 0)`);
  console.log(`   User B all badges locked: ${compBRes.badges?.every(b => !b.unlocked)}`);

  // 9. User A removes 1 completion
  console.log(`\n9. User A removing 1 completion ("${goaTrail.name}")...`);
  const remRes = await (await fetch(`http://localhost:5000/api/completions/${goaTrail.id}`, {
    method: 'DELETE',
    headers: headersA
  })).json();
  console.log(`   Remove status: ${remRes.success}`);

  const compAfterRem = await (await fetch('http://localhost:5000/api/completions', { headers: headersA })).json();
  console.log(`   Total Completed Trails after removal: ${compAfterRem.totalCompleted} (Expected: 4)`);

  const explorerAfterRem = compAfterRem.badges?.find(b => b.id === 'explorer');
  console.log(`   "Explorer" Badge re-locked: ${!explorerAfterRem?.unlocked} (Expected: true)`);

  // 10. Check /api/users/me for User A
  console.log('\n10. Checking User A /api/users/me statistics:');
  const meA = await (await fetch('http://localhost:5000/api/users/me', { headers: headersA })).json();
  console.log(`   completionsCount in Profile: ${meA.data?.completionsCount} (Expected: 4)`);

  const passed =
    initCompA.totalCompleted === 0 &&
    mark1.success &&
    checkStatus.completed &&
    compAfterDup.totalCompleted === 1 &&
    comp5Res.totalCompleted === 5 &&
    firstAdv?.unlocked === true &&
    explorerBadge?.unlocked === true &&
    mtnTrekkerBadge?.unlocked === false &&
    compBRes.totalCompleted === 0 &&
    compAfterRem.totalCompleted === 4 &&
    !explorerAfterRem?.unlocked &&
    meA.data?.completionsCount === 4;

  console.log('\n====================================================');
  console.log(`ACHIEVEMENTS FEATURE TEST RESULT: ${passed ? 'PASSED' : 'FAILED'}`);
  console.log('====================================================');
}

testAchievementsFeature();
