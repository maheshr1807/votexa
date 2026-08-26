const mongoose = require('mongoose');

/**
 * VoteAuditLog — records every officer action during a single voter's offline voting session.
 * One document per voter session. Events[] is an append-only log.
 *
 * Status flow:
 *   pending_selection → candidate_sent → voter_confirmed (terminal)
 *                                      → change_requested → pending_selection (loop)
 *                    → abandoned (terminal, timeout or officer navigates away)
 */
const auditEventSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'session_started',
      'candidate_selected',    // officer chose a candidate and sent to voter screen
      'voter_requested_change',// voter pressed CHANGE
      'candidate_reselected',  // officer chose again after change
      'voter_confirmed'        // voter pressed FINAL CONFIRM — vote locked
    ],
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    default: null
  },
  candidateName: { type: String, default: null },
  partyName:     { type: String, default: null },
  timestamp:     { type: Date, default: Date.now }
}, { _id: false });

const voteAuditLogSchema = new mongoose.Schema({
  // Unique session ID (UUID) — shared with voter screen via URL
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officerName: { type: String, default: '' },

  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voter',
    required: true
  },
  voterIdStr: { type: String, required: true },  // e.g. "ABC1234567"
  voterName:  { type: String, default: '' },

  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  electionTitle: { type: String, default: '' },

  officeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GovernmentOffice',
    default: null
  },

  // Current candidate awaiting voter confirmation (may change on CHANGE requests)
  currentCandidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    default: null
  },
  currentCandidateName: { type: String, default: null },
  currentPartyName:     { type: String, default: null },
  currentCandidatePhoto:{ type: String, default: null },

  // Session lifecycle
  status: {
    type: String,
    enum: ['pending_selection', 'candidate_sent', 'change_requested', 'voter_confirmed', 'abandoned'],
    default: 'pending_selection'
  },

  // Set once vote is locked
  finalCandidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    default: null
  },
  receiptId: { type: String, default: null },  // e.g. "VOTE-8F29A71C"

  // How many times did the voter request a change in this session?
  changeCount: { type: Number, default: 0 },

  // Append-only event log
  events: [auditEventSchema],

  // When this session was created (for timeout logic)
  startedAt: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model('VoteAuditLog', voteAuditLogSchema);
