const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true
  },
  party: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true
  },
  partySymbol: {
    type: String,
    trim: true
  },
  photo: {
    type: String, // file path
    default: null
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voteCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
