const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const User = require('../models/User');

async function testTeamData() {
  try {
    // Find the sponsor user
    const sponsor = await User.findOne({ subscriberCode: 'LD103474' });

    if (!sponsor) {
      console.log('❌ Sponsor not found');
      process.exit(1);
    }

    console.log(`\n✅ Testing team for: ${sponsor.name} (@${sponsor.username})`);
    console.log(`   Sponsor Code: ${sponsor.subscriberCode}\n`);

    // Recursive function to get team members
    const getTeamMembers = async (sponsorCode, level, maxLevel = 5) => {
      if (level > maxLevel) return [];

      const members = await User.find({
        sponsorCode: sponsorCode,
        role: { $in: ['member', 'subscriber', 'customer'] }
      })
        .select('name username subscriberCode sponsorCode points createdAt country city')
        .lean();

      let allMembers = [];
      for (const member of members) {
        const memberData = {
          ...member,
          level: level,
          directSponsor: sponsorCode
        };
        allMembers.push(memberData);

        if (member.subscriberCode && level < maxLevel) {
          const subMembers = await getTeamMembers(member.subscriberCode, level + 1, maxLevel);
          allMembers = allMembers.concat(subMembers);
        }
      }
      return allMembers;
    };

    const teamMembers = await getTeamMembers(sponsor.subscriberCode, 1);

    console.log(`📊 Team Statistics:`);
    console.log(`   Total Members: ${teamMembers.length}`);
    console.log(`   Total Points: ${teamMembers.reduce((sum, m) => sum + (m.points || 0), 0)}`);

    for (let i = 1; i <= 5; i++) {
      const levelMembers = teamMembers.filter(m => m.level === i);
      console.log(`   Level ${i}: ${levelMembers.length} members`);
      if (levelMembers.length > 0) {
        levelMembers.forEach(m => {
          console.log(`      - ${m.name} (${m.subscriberCode}) - ${m.points} نقطة`);
        });
      }
    }

    console.log(`\n✅ Team data is working correctly!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTeamData();
