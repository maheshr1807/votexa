const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Election title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Online voting phase
  onlineStartDate: {
    type: Date,
    required: true
  },
  onlineEndDate: {
    type: Date,
    required: true
  },
  // Offline voting phase
  offlineStartDate: {
    type: Date,
    required: true
  },
  offlineEndDate: {
    type: Date,
    required: true
  },
  // Results announcement date
  resultsDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'online', 'offline', 'ended'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  onlineVotes: {
    type: Number,
    default: 0
  },
  offlineVotes: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Election', electionSchema);
