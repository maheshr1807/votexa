/**
 * Reset voter password utility
 * Usage: node server/reset-voter-password.js <voterId> <newPassword>
 * Example: node server/reset-voter-password.js ABC1234567 mypassword123
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const voterId = process.argv[2];
  const newPassword = process.argv[3];

  if (!voterId || !newPassword) {
    console.error('Usage: node reset-voter-password.js <voterId> <newPassword>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // Find voter
  const Voter = require('./models/Voter');
  const User = require('./models/User');

  const voter = await Voter.findOne({ voterId: voterId.toUpperCase() });
  if (!voter) {
    console.error(`❌ Voter with ID "${voterId}" not found.`);
    process.exit(1);
  }

  const user = await User.findById(voter.userId).select('+password');
  if (!user) {
    console.error(`❌ User linked to voter "${voterId}" not found.`);
    process.exit(1);
  }

  // Hash and save new password
  const hashed = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(user._id, { $set: { password: hashed } });

  console.log(`✅ Password reset for Voter ID: ${voter.voterId} (${user.email})`);
  console.log(`   New password: ${newPassword}`);
  process.exit(0);
}

resetPassword().catch(err => { console.error(err); process.exit(1); });
