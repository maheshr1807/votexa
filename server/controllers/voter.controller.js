const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const { decrypt, encrypt } = require('../config/encryption');
const { generateVoteHash } = require('../middleware/voteIntegrity');

/**
 * @desc    Get active election and candidates
 *          Also returns hasVotedInThisElection — checked against the Vote
 *          collection for the CURRENT election, not voter.hasVoted (which is
 *          stale from previous elections).
 * @route   GET /api/voter/election
 * @access  Private (voter | officer)
 */
const getActiveElection = async (req, res) => {
  try {
    const election = await Election.findOne({ status: { $in: ['online', 'offline'] } });
    if (!election) {
      return res.status(404).json({ success: false, message: 'No active election at this time.' });
    }

    const candidates = await Candidate.find({ electionId: election._id, isActive: true });

    // Check if this voter has voted in THIS specific election (election-aware)
    let hasVotedInThisElection = false;
    let voteMode = null;
    if (req.user?.role === 'voter') {
      const voterDoc = await Voter.findOne({ userId: req.user._id }).select('_id');
      if (voterDoc) {
        const existingVote = await Vote.findOne({ voterId: voterDoc._id, electionId: election._id });
        hasVotedInThisElection = !!existingVote;
        voteMode = existingVote?.voteMode || null;
      }
    }

    res.json({
      success: true,
      election,
      candidates,
      hasVotedInThisElection,
      voteMode
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get voter status
 * @route   GET /api/voter/status
 * @access  Private (voter)
 */
const getVoterStatus = async (req, res) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id }).select('-faceEmbedding');
    if (!voter) return res.status(404).json({ success: false, message: 'Voter profile not found.' });

    // Also find vote record for current active election
    const election = await Election.findOne({ status: { $in: ['online', 'offline', 'ended'] } }).sort({ createdAt: -1 });
    let voteRecord = null;
    if (election) {
      voteRecord = await Vote.findOne({ voterId: voter._id, electionId: election._id })
        .populate('candidateId', 'name party photo');
    }

    res.json({ success: true, voter, voteRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get voter's stored face embedding for client-side comparison
 * @route   GET /api/voter/face-embedding
 * @access  Private (voter)
 */
const getFaceEmbedding = async (req, res) => {
  try {
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter not found.' });
    if (!voter.faceEmbedding) return res.status(404).json({ success: false, message: 'No face data registered.' });

    // Decrypt and return the embedding for client-side comparison
    const embedding = decrypt(voter.faceEmbedding);
    res.json({ success: true, embedding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cast online vote
 * @route   POST /api/voter/vote
 * @access  Private (voter)
 */
const castOnlineVote = async (req, res) => {
  try {
    const { candidateId, electionId } = req.body;

    // Get voter
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter profile not found.' });

    // Check election status
    const election = await Election.findById(electionId);
    if (!election || election.status !== 'online') {
      return res.status(400).json({ success: false, message: 'Online voting is not active.' });
    }

    // Check if already voted IN THIS ELECTION (not voter.hasVoted which is stale)
    const existingVote = await Vote.findOne({ voterId: voter._id, electionId });
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already cast your vote in this election.' });
    }

    // Check candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate || candidate.electionId.toString() !== electionId) {
      return res.status(400).json({ success: false, message: 'Invalid candidate.' });
    }

    const timestamp = new Date();

    // Generate integrity hash
    const integrityHash = generateVoteHash(
      voter._id.toString(),
      candidateId,
      electionId,
      timestamp.toISOString()
    );

    // Create vote record
    await Vote.create({
      voterId: voter._id,
      candidateId,
      electionId,
      voteMode: 'online',
      integrityHash,
      timestamp
    });

    // Update voter status flags (kept for compatibility)
    voter.hasVoted = true;
    voter.voteMode = 'online';
    voter.votedAt = timestamp;
    await voter.save();

    // Increment candidate vote count and election totals
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });
    await Election.findByIdAndUpdate(electionId, {
      $inc: { totalVotes: 1, onlineVotes: 1 }
    });

    res.json({
      success: true,
      message: 'Your vote has been cast successfully!',
      integrityHash // Return hash as receipt
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate vote detected.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Save WebAuthn credential ID (called after registration)
 * @route   POST /api/voter/save-webauthn
 * @access  Private (voter)
 */
const saveWebAuthn = async (req, res) => {
  try {
    const { credentialId, publicKey } = req.body;
    const voter = await Voter.findOne({ userId: req.user._id });
    if (!voter) return res.status(404).json({ success: false, message: 'Voter not found.' });

    voter.webAuthnCredentialId = credentialId;
    voter.webAuthnPublicKey = publicKey;
    await voter.save();

    res.json({ success: true, message: 'Biometric credential saved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveElection,
  getVoterStatus,
  getFaceEmbedding,
  castOnlineVote,
  saveWebAuthn
};
