const { randomUUID } = require('crypto');
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const GovernmentOffice = require('../models/GovernmentOffice');
const VoteAuditLog = require('../models/VoteAuditLog');
const { decrypt } = require('../config/encryption');
const { generateVoteHash } = require('../middleware/voteIntegrity');

// ─────────────────────────────────────────────
// Helper: generate receipt ID like VOTE-8F29A71C
// ─────────────────────────────────────────────
function generateReceiptId() {
  return 'VOTE-' + randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
}

/**
 * @desc    Search voter by voter ID
 * @route   GET /api/officer/search/:voterId
 * @access  Private (officer)
 */
const searchVoter = async (req, res) => {
  try {
    const voter = await Voter.findOne({ voterId: req.params.voterId.toUpperCase() }).select('-faceEmbedding');
    if (!voter) return res.status(404).json({ success: false, message: 'Voter not found.' });

    res.json({ success: true, voter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get voter's face embedding for officer verification
 * @route   GET /api/officer/face/:voterId
 * @access  Private (officer)
 */
const getVoterFaceEmbedding = async (req, res) => {
  try {
    const voter = await Voter.findOne({ voterId: req.params.voterId.toUpperCase() });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter not found.' });
    if (!voter.faceEmbedding) return res.status(404).json({ success: false, message: 'No face data registered for this voter.' });

    const embedding = decrypt(voter.faceEmbedding);
    res.json({ success: true, embedding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Start a new vote session (officer initiates after face verification)
 * @route   POST /api/officer/session/start
 * @access  Private (officer)
 */
const startVoteSession = async (req, res) => {
  try {
    const { voterIdStr, electionId, officeId } = req.body;

    const voter = await Voter.findOne({ voterId: voterIdStr.toUpperCase() });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter not found.' });

    const election = await Election.findById(electionId);
    if (!election || election.status !== 'offline') {
      return res.status(400).json({ success: false, message: 'Offline voting is not active.' });
    }

    // Check if already voted IN THIS ELECTION (voter.hasVoted is stale from previous elections)
    const existingVote = await Vote.findOne({ voterId: voter._id, electionId });
    if (existingVote) {
      return res.status(400).json({ success: false, message: `${voter.name} has already voted in this election (${existingVote.voteMode}).` });
    }

    // Check if there's already an active (non-terminal) session for this voter
    const existing = await VoteAuditLog.findOne({
      voterId: voter._id,
      electionId,
      status: { $in: ['pending_selection', 'candidate_sent', 'change_requested'] }
    });
    if (existing) {
      // Return existing session so officer can resume
      return res.json({ success: true, sessionId: existing.sessionId, resumed: true });
    }

    const sessionId = randomUUID();

    await VoteAuditLog.create({
      sessionId,
      officerId: req.user._id,
      officerName: req.user.name,
      voterId: voter._id,
      voterIdStr: voter.voterId,
      voterName: voter.name,
      electionId,
      electionTitle: election.title,
      officeId: officeId || null,
      status: 'pending_selection',
      events: [{
        action: 'session_started',
        timestamp: new Date()
      }]
    });

    res.json({ success: true, sessionId, voterName: voter.name });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Officer selects a candidate and sends to voter screen
 * @route   POST /api/officer/session/select
 * @access  Private (officer)
 */
const selectCandidate = async (req, res) => {
  try {
    const { sessionId, candidateId } = req.body;

    const session = await VoteAuditLog.findOne({ sessionId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (session.status === 'voter_confirmed' || session.status === 'abandoned') {
      return res.status(400).json({ success: false, message: `Session already ${session.status}.` });
    }

    // Verify the officer owns this session
    if (session.officerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your session.' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(400).json({ success: false, message: 'Invalid candidate.' });

    const isReselection = session.status === 'change_requested';
    const action = isReselection ? 'candidate_reselected' : 'candidate_selected';

    session.currentCandidateId   = candidate._id;
    session.currentCandidateName = candidate.name;
    session.currentPartyName     = candidate.party;
    session.currentCandidatePhoto= candidate.photo;
    session.status = 'candidate_sent';
    session.events.push({ action, candidateId: candidate._id, candidateName: candidate.name, partyName: candidate.party, timestamp: new Date() });

    await session.save();

    res.json({ success: true, message: 'Candidate sent to voter screen.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current session status (polled by both officer and voter screens)
 * @route   GET /api/officer/session/:sessionId
 * @access  Public (voter screen has no auth token)
 */
const getSessionStatus = async (req, res) => {
  try {
    const session = await VoteAuditLog.findOne({ sessionId: req.params.sessionId })
      .populate('currentCandidateId', 'name party photo partySymbol');

    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    res.json({
      success: true,
      status: session.status,
      voterName: session.voterName,
      voterIdStr: session.voterIdStr,
      electionTitle: session.electionTitle,
      candidate: session.currentCandidateId || null,
      candidateName: session.currentCandidateName,
      partyName: session.currentPartyName,
      candidatePhoto: session.currentCandidatePhoto,
      receiptId: session.receiptId,
      finalCandidateId: session.finalCandidateId,
      events: session.events,
      startedAt: session.startedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Voter requests a change (voter screen — no auth token)
 * @route   POST /api/officer/session/change
 * @access  Public (called from voter screen)
 */
const voterRequestChange = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await VoteAuditLog.findOne({ sessionId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (session.status !== 'candidate_sent') {
      return res.status(400).json({ success: false, message: 'No candidate pending confirmation.' });
    }

    session.status = 'change_requested';
    session.changeCount += 1;
    session.events.push({
      action: 'voter_requested_change',
      candidateId: session.currentCandidateId,
      candidateName: session.currentCandidateName,
      partyName: session.currentPartyName,
      timestamp: new Date()
    });

    await session.save();
    res.json({ success: true, message: 'Change requested. Officer notified.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Voter presses FINAL CONFIRM — locks the vote permanently
 * @route   POST /api/officer/session/confirm
 * @access  Public (called from voter screen — no auth token)
 */
const voterConfirmVote = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await VoteAuditLog.findOne({ sessionId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (session.status !== 'candidate_sent') {
      return res.status(400).json({ success: false, message: 'No candidate awaiting confirmation.' });
    }

    // Re-verify voter hasn't voted IN THIS ELECTION (race condition guard)
    const voter = await Voter.findById(session.voterId);
    if (!voter) return res.status(404).json({ success: false, message: 'Voter not found.' });
    const existingVoteGuard = await Vote.findOne({ voterId: voter._id, electionId: session.electionId });
    if (existingVoteGuard) {
      return res.status(400).json({ success: false, message: `${voter.name} has already voted in this election.` });
    }

    // Re-verify election still active
    const election = await Election.findById(session.electionId);
    if (!election || election.status !== 'offline') {
      return res.status(400).json({ success: false, message: 'Offline voting is not active.' });
    }

    const timestamp = new Date();
    const receiptId = generateReceiptId();

    const integrityHash = generateVoteHash(
      voter._id.toString(),
      session.currentCandidateId.toString(),
      session.electionId.toString(),
      timestamp.toISOString()
    );

    // Create the actual vote record
    await Vote.create({
      voterId: voter._id,
      candidateId: session.currentCandidateId,
      electionId: session.electionId,
      voteMode: 'offline',
      integrityHash,
      officerId: session.officerId,
      officeId: session.officeId || null,
      timestamp
    });

    // Update voter record
    voter.hasVoted = true;
    voter.voteMode = 'offline';
    voter.votedAt  = timestamp;
    await voter.save();

    // Update counts
    await Candidate.findByIdAndUpdate(session.currentCandidateId, { $inc: { voteCount: 1 } });
    await Election.findByIdAndUpdate(session.electionId, { $inc: { totalVotes: 1, offlineVotes: 1 } });

    // Lock session
    session.status             = 'voter_confirmed';
    session.finalCandidateId   = session.currentCandidateId;
    session.receiptId          = receiptId;
    session.events.push({
      action: 'voter_confirmed',
      candidateId:   session.currentCandidateId,
      candidateName: session.currentCandidateName,
      partyName:     session.currentPartyName,
      timestamp
    });
    await session.save();

    res.json({
      success: true,
      receiptId,
      candidateName: session.currentCandidateName,
      partyName:     session.currentPartyName,
      candidatePhoto: session.currentCandidatePhoto,
      electionTitle: session.electionTitle,
      voterName:     session.voterName,
      timestamp:     timestamp.toISOString(),
      integrityHash
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate vote detected.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Abandon a session (officer navigates away / timeout)
 * @route   POST /api/officer/session/abandon
 * @access  Private (officer)
 */
const abandonSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await VoteAuditLog.findOne({ sessionId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (['voter_confirmed', 'abandoned'].includes(session.status)) {
      return res.json({ success: true, message: 'Session already terminal.' });
    }

    session.status = 'abandoned';
    await session.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cast offline vote (legacy — kept for backward compatibility)
 * @route   POST /api/officer/vote
 * @access  Private (officer)
 */
const castOfflineVote = async (req, res) => {
  try {
    const { voterIdStr, candidateId, electionId, officeId } = req.body;

    const voter = await Voter.findOne({ voterId: voterIdStr.toUpperCase() });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter not found.' });

    const election = await Election.findById(electionId);
    if (!election || election.status !== 'offline') {
      return res.status(400).json({ success: false, message: 'Offline voting is not active.' });
    }

    // Check if already voted IN THIS ELECTION (voter.hasVoted is stale from previous elections)
    const existingVoteCheck = await Vote.findOne({ voterId: voter._id, electionId });
    if (existingVoteCheck) {
      return res.status(400).json({ success: false, message: `${voter.name} has already voted in this election (${existingVoteCheck.voteMode}).` });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(400).json({ success: false, message: 'Invalid candidate.' });

    const timestamp = new Date();

    const integrityHash = generateVoteHash(
      voter._id.toString(),
      candidateId,
      electionId,
      timestamp.toISOString()
    );

    await Vote.create({
      voterId: voter._id,
      candidateId,
      electionId,
      voteMode: 'offline',
      integrityHash,
      officerId: req.user._id,
      officeId: officeId || null,
      timestamp
    });

    voter.hasVoted = true;
    voter.voteMode = 'offline';
    voter.votedAt = timestamp;
    await voter.save();

    await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });
    await Election.findByIdAndUpdate(electionId, { $inc: { totalVotes: 1, offlineVotes: 1 } });

    res.json({ success: true, message: `Offline vote cast successfully for ${voter.name}.`, integrityHash });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate vote detected.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  searchVoter,
  getVoterFaceEmbedding,
  startVoteSession,
  selectCandidate,
  getSessionStatus,
  voterRequestChange,
  voterConfirmVote,
  abandonSession,
  castOfflineVote
};
