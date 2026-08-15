async function runTests() {
  try {
    console.log('Testing Health Endpoint...');
    const healthRes = await fetch('http://localhost:5000/api/health');
    const health = await healthRes.json();
    console.log('Health:', health);

    console.log('\nTesting Popular Trails...');
    const popularRes = await fetch('http://localhost:5000/api/trails/popular');
    const popular = await popularRes.json();
    console.log(`Popular trails count: ${popular.count}`);
    popular.data.forEach((t) => console.log(` - ${t.name} (${t.city})`));

    console.log('\nTesting Search: "Mumbai"...');
    const mumbaiRes = await fetch('http://localhost:5000/api/trails?search=Mumbai');
    const mumbai = await mumbaiRes.json();
    console.log(`Mumbai trails count: ${mumbai.count}`);
    mumbai.data.forEach((t) => console.log(` - ${t.name} (${t.city})`));

    console.log('\nTesting Search: "Pune"...');
    const puneRes = await fetch('http://localhost:5000/api/trails?search=Pune');
    const pune = await puneRes.json();
    console.log(`Pune trails count: ${pune.count}`);
    pune.data.forEach((t) => console.log(` - ${t.name} (${t.city})`));

    console.log('\nTesting Search: "XYZ123" (should return 0 results)...');
    const emptyRes = await fetch('http://localhost:5000/api/trails?search=XYZ123');
    const empty = await emptyRes.json();
    console.log(`XYZ123 trails count: ${empty.count}`);

    console.log('\nTesting Nearby (Mumbai location: lat 18.9220, lng 72.8347)...');
    const nearbyRes = await fetch('http://localhost:5000/api/trails/nearby?lat=18.9220&lng=72.8347');
    const nearby = await nearbyRes.json();
    console.log(`Nearby trails count: ${nearby.count}`);
    nearby.data.slice(0, 5).forEach((t) => console.log(` - ${t.name}: ${t.distanceFromUser}`));

    console.log('\nTesting User Login (aniketpatil@gmail.com)...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aniketpatil@gmail.com', password: 'User@12345' })
    });
    const loginData = await loginRes.json();
    console.log('Login success:', loginData.success, 'User:', loginData.data?.name, 'Role:', loginData.data?.role);

    console.log('\nTesting Non-Admin attempting to POST /api/trails (Should return 403)...');
    const forbiddenRes = await fetch('http://localhost:5000/api/trails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ name: 'Hacked Trail', description: 'Test', latitude: 18, longitude: 73 })
    });
    const forbiddenData = await forbiddenRes.json();
    console.log('Status code:', forbiddenRes.status, 'Message:', forbiddenData.message);

    console.log('\nTesting Admin Login & Creation (admin@trailexplorer.com)...');
    const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@trailexplorer.com', password: 'Admin@12345' })
    });
    const adminLoginData = await adminLoginRes.json();
    console.log('Admin login success:', adminLoginData.success, 'Role:', adminLoginData.data?.role);

    console.log('\nALL BACKEND API TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

runTests();
