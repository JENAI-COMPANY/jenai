const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');

const runDiagnostic = async () => {
  try {
    await mongoose.connect('mongodb://104.218.48.119:27017/jenai_db');
    console.log('=== FULL SYSTEM DIAGNOSTIC ===\n');

    // 1. Check Users
    console.log('1️⃣ USERS CHECK:');
    const users = await User.find().sort({createdAt: -1}).limit(5)
      .select('name username role points monthlyPoints bonusPoints sponsorId referredBy');
    console.log('Recent 5 users:');
    users.forEach(u => {
      console.log(`  - ${u.name} (@${u.username})`);
      console.log(`    Role: ${u.role}`);
      console.log(`    Points: ${u.points || 0}`);
      console.log(`    Monthly: ${u.monthlyPoints || 0}`);
      console.log(`    Bonus: ${u.bonusPoints || 0}`);
      console.log(`    SponsorId: ${u.sponsorId ? 'Yes' : 'No'}`);
      console.log(`    ReferredBy: ${u.referredBy ? 'Yes' : 'No'}`);
    });

    // 2. Check Orders
    console.log('\n2️⃣ ORDERS CHECK:');
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find().sort({createdAt: -1}).limit(5)
      .select('orderNumber user status totalPrice createdAt');
    console.log(`Total orders in DB: ${totalOrders}`);
    console.log('Recent 5 orders:');
    for (const o of orders) {
      const user = await User.findById(o.user).select('name');
      console.log(`  - ${o.orderNumber} - User: ${user?.name || 'Unknown'} - Status: ${o.status} - $${o.totalPrice}`);
    }

    // 3. Check Team Structure
    console.log('\n3️⃣ TEAM STRUCTURE CHECK:');
    const membersWithSponsors = await User.find({sponsorId: {$ne: null}})
      .select('name username sponsorId');
    console.log(`Members with sponsors: ${membersWithSponsors.length}`);
    for (const m of membersWithSponsors.slice(0, 5)) {
      const sponsor = await User.findById(m.sponsorId).select('name subscriberCode');
      console.log(`  - ${m.name} sponsored by: ${sponsor?.name || 'Unknown'} (${sponsor?.subscriberCode || 'N/A'})`);
    }

    // 4. Check for any member with points
    console.log('\n4️⃣ MEMBERS WITH POINTS:');
    const withPoints = await User.find({
      $or: [
        {points: {$gt: 0}},
        {monthlyPoints: {$gt: 0}},
        {bonusPoints: {$gt: 0}}
      ]
    }).select('name points monthlyPoints bonusPoints');
    console.log(`Members with any points: ${withPoints.length}`);
    withPoints.forEach(u => {
      console.log(`  - ${u.name} - Points: ${u.points} - Monthly: ${u.monthlyPoints} - Bonus: ${u.bonusPoints}`);
    });

    // 5. Test Update
    console.log('\n5️⃣ TEST UPDATE:');
    const testUser = await User.findOne({username: 'hanan'});
    if (testUser) {
      console.log('Before update:');
      console.log(`  Points: ${testUser.points}, Monthly: ${testUser.monthlyPoints}, Bonus: ${testUser.bonusPoints}`);

      testUser.points = 999;
      testUser.monthlyPoints = 888;
      testUser.bonusPoints = 777;
      await testUser.save();

      const afterSave = await User.findOne({username: 'hanan'});
      console.log('After update:');
      console.log(`  Points: ${afterSave.points}, Monthly: ${afterSave.monthlyPoints}, Bonus: ${afterSave.bonusPoints}`);

      // Reset
      testUser.points = 0;
      testUser.monthlyPoints = 0;
      testUser.bonusPoints = 0;
      await testUser.save();
      console.log('Reset back to 0');
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
};

runDiagnostic();
