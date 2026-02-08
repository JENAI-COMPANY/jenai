const axios = require('axios');

const testUpdate = async () => {
  try {
    // Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in as admin');

    const userId = '697fc55880d6a725b7fc112a'; // حنان

    // Update user
    console.log('\n📝 Updating user with:');
    console.log('  points: 200');
    console.log('  monthlyPoints: 150');
    console.log('  bonusPoints: 100');

    const updateRes = await axios.put(
      `http://localhost:5000/api/admin/users/${userId}`,
      {
        points: 200,
        monthlyPoints: 150,
        bonusPoints: 100
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('\n✅ Update response:');
    console.log('  points:', updateRes.data.data.points);
    console.log('  monthlyPoints:', updateRes.data.data.monthlyPoints);
    console.log('  bonusPoints:', updateRes.data.data.bonusPoints);

    // Fetch again to verify
    const checkRes = await axios.get(
      `http://localhost:5000/api/admin/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('\n🔍 After fetching again:');
    console.log('  points:', checkRes.data.data.points);
    console.log('  monthlyPoints:', checkRes.data.data.monthlyPoints);
    console.log('  bonusPoints:', checkRes.data.data.bonusPoints);

  } catch (err) {
    console.log('❌ Error:', err.response?.data || err.message);
  }
  process.exit(0);
};

testUpdate();
