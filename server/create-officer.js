/**
 * Create a polling officer account
 * Usage: node server/create-officer.js <name> <email> <password>
 * Example: node server/create-officer.js "John Officer" officer@gov.in officer123
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createOfficer() {
  const name = process.argv[2] || 'Polling Officer';
  const email = process.argv[3] || 'officer@gov.in';
  const password = process.argv[4] || 'Officer@123';

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`ℹ️  User with email "${email}" already exists (role: ${existing.role}).`);
    if (existing.role !== 'officer') {
      await User.findByIdAndUpdate(existing._id, { role: 'officer', isVerified: true });
      console.log(`✅ Updated role to "officer" for: ${email}`);
    } else {
      // Reset password
      existing.password = password;
      await existing.save();
      console.log(`✅ Password reset for officer: ${email}`);
    }
    process.exit(0);
  }

  const officer = await User.create({
    name,
    email,
    mobile: '9000000000',
    password,
    role: 'officer',
    isVerified: true
  });

  console.log('✅ Officer account created!');
  console.log(`   Name    : ${officer.name}`);
  console.log(`   Email   : ${officer.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role    : ${officer.role}`);
  process.exit(0);
}

createOfficer().catch(err => { console.error(err); process.exit(1); });
