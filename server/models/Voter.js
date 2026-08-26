const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  voterId: {
    type: String,
    required: [true, 'Voter ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  photo: {
    type: String, // file path
    default: null
  },
  // AES-256 encrypted face descriptor (128-dimensional float array from face-api.js)
  faceEmbedding: {
    type: String,
    default: null
  },
  // WebAuthn credential ID for biometric auth
  webAuthnCredentialId: {
    type: String,
    default: null
  },
  webAuthnPublicKey: {
    type: String,
    default: null
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  voteMode: {
    type: String,
    enum: ['online', 'offline', null],
    default: null
  },
  votedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Voter', voterSchema);
