const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voter',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voteMode: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  // SHA-256 hash of (voterId + candidateId + timestamp) for integrity verification
  integrityHash: {
    type: String,
    required: true
  },
  // Officer who cast the offline vote (for offline mode only)
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  officeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GovernmentOffice',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure a voter can only vote once per election
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
