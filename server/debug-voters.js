/**
 * Debug script — lists all voters + their linked users in DB
 * Run: node server/debug-voters.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Voter = require('./models/Voter');

async function debugVoters() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const voters = await Voter.find({}).lean();
  console.log(`Found ${voters.length} voter(s) in DB:\n`);

  for (const v of voters) {
    const user = await User.findById(v.userId).select('+password').lean();
    console.log('─────────────────────────────────');
    console.log(`Voter ID  : ${v.voterId}`);
    console.log(`Name      : ${v.name}`);
    console.log(`User email: ${user?.email || 'NOT FOUND'}`);
    console.log(`Has user  : ${!!user}`);
    console.log(`Has pwd   : ${!!(user?.password)}`);
    console.log(`isVerified: ${user?.isVerified}`);
    console.log(`isActive  : ${user?.isActive}`);
    console.log(`hasVoted  : ${v.hasVoted}`);
    console.log(`photo     : ${v.photo || 'none'}`);
  }

  console.log('\n─────────────────────────────────');
  console.log('To test a login manually, use:');
  console.log('  curl -X POST http://localhost:5000/api/auth/login \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"voterId":"<VOTER_ID>","password":"<PASSWORD>","role":"voter"}\'');
  
  process.exit(0);
}

debugVoters().catch(err => { console.error(err); process.exit(1); });
