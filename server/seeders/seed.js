/**
 * Database Seeder — Creates admin account + sample election
 * Run: node server/seeders/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Create Admin
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@votesecure.com',
      mobile: '9999999999',
      password: 'Admin@1234',
      role: 'admin',
      isVerified: true
    });
    console.log('✅ Admin created:', admin.email, '| Password: Admin@1234');
  } else {
    console.log('ℹ️  Admin already exists:', existingAdmin.email);
  }

  // Create Sample Election
  const existingElection = await Election.findOne({ title: 'General Election 2024' });
  if (!existingElection) {
    const now = new Date();
    const election = await Election.create({
      title: 'General Election 2024',
      description: 'National General Election — Choose your representative.',
      onlineStartDate: new Date(now.getTime()),
      onlineEndDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      offlineStartDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      offlineEndDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      resultsDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'online'
    });
    console.log('✅ Election created:', election.title);

    // Create Candidates
    const candidatesData = [
      { name: 'Rahul Sharma', party: 'Progressive Alliance', partySymbol: '🌸 Lotus' },
      { name: 'Priya Patel', party: 'United Democratic Front', partySymbol: '🤚 Hand' },
      { name: 'Arjun Singh', party: 'National Development Party', partySymbol: '⚡ Bolt' },
    ];

    for (const c of candidatesData) {
      await Candidate.create({ ...c, electionId: election._id });
    }
    console.log('✅ 3 candidates created');
  } else {
    console.log('ℹ️  Election already exists');
  }

  console.log('\n🎉 Seeding complete!');
  console.log('Admin Login: admin@votesecure.com / Admin@1234');
  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
