const User = require('../models/User');
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const GovernmentOffice = require('../models/GovernmentOffice');
const Vote = require('../models/Vote');
const VoteAuditLog = require('../models/VoteAuditLog');

// ───── CANDIDATES ─────

const addCandidate = async (req, res) => {
  try {
    const { name, party, partySymbol, electionId } = req.body;
    const photo = req.file ? `/uploads/candidates/${req.file.filename}` : null;

    const candidate = await Candidate.create({ name, party, partySymbol, photo, electionId });
    res.status(201).json({ success: true, message: 'Candidate added.', candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCandidates = async (req, res) => {
  try {
    const { electionId } = req.query;
    const filter = electionId ? { electionId } : {};
    const candidates = await Candidate.find(filter).populate('electionId', 'title status');
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { name, party, partySymbol } = req.body;
    const updateData = { name, party, partySymbol };
    if (req.file) updateData.photo = `/uploads/candidates/${req.file.filename}`;

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found.' });

    res.json({ success: true, message: 'Candidate updated.', candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found.' });
    res.json({ success: true, message: 'Candidate deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───── ELECTIONS ─────

const createElection = async (req, res) => {
  try {
    const { title, description, onlineStartDate, onlineEndDate, offlineStartDate, offlineEndDate, resultsDate } = req.body;
    const election = await Election.create({
      title, description, onlineStartDate, onlineEndDate,
      offlineStartDate, offlineEndDate, resultsDate, createdBy: req.user._id
    });
    res.status(201).json({ success: true, message: 'Election created.', election });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getElections = async (req, res) => {
  try {
    const elections = await Election.find().populate('createdBy', 'name email');
    res.json({ success: true, elections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateElectionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['upcoming', 'online', 'offline', 'ended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const election = await Election.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });
    res.json({ success: true, message: `Election status updated to ${status}.`, election });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───── OFFICERS ─────

const addOfficer = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists.' });

    const officer = await User.create({ name, email, mobile, password, role: 'officer', isVerified: true });
    res.status(201).json({ success: true, message: 'Polling officer added.', officer: { id: officer._id, name, email, role: officer.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' }).select('-password');
    res.json({ success: true, officers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───── GOVERNMENT OFFICES ─────

const addOffice = async (req, res) => {
  try {
    const { officeName, district, state, address, officerId } = req.body;
    const office = await GovernmentOffice.create({ officeName, district, state, address, officerId });
    res.status(201).json({ success: true, message: 'Government office added.', office });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOffices = async (req, res) => {
  try {
    const offices = await GovernmentOffice.find().populate('officerId', 'name email');
    res.json({ success: true, offices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───── DASHBOARD ─────

const getDashboard = async (req, res) => {
  try {
    const [totalVoters, totalCandidates, totalElections, totalVotes, activeElection] = await Promise.all([
      Voter.countDocuments(),
      Candidate.countDocuments({ isActive: true }),
      Election.countDocuments(),
      Vote.countDocuments(),
      Election.findOne({ status: { $in: ['online', 'offline'] } })
    ]);

    const votersTurnout = await Voter.countDocuments({ hasVoted: true });

    res.json({
      success: true,
      stats: {
        totalVoters,
        votersTurnout,
        turnoutPercent: totalVoters ? ((votersTurnout / totalVoters) * 100).toFixed(1) : 0,
        totalCandidates,
        totalElections,
        totalVotes,
        activeElection
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───── OFFICER AUDIT ─────

/**
 * @desc    Get per-officer audit statistics + session logs for admin dashboard
 * @route   GET /api/admin/officer-audit
 * @access  Private (admin)
 */
const getOfficerAuditStats = async (req, res) => {
  try {
    // All confirmed or terminal sessions
    const sessions = await VoteAuditLog.find()
      .populate('officerId', 'name email')
      .sort({ createdAt: -1 });

    // Aggregate stats per officer
    const officerMap = {};
    for (const s of sessions) {
      const oId = s.officerId?._id?.toString() || 'unknown';
      if (!officerMap[oId]) {
        officerMap[oId] = {
          officerId: oId,
          officerName: s.officerName || s.officerId?.name || 'Unknown',
          officerEmail: s.officerId?.email || '',
          totalSessions: 0,
          confirmedVotes: 0,
          totalChanges: 0,
          sessions: []
        };
      }
      const o = officerMap[oId];
      o.totalSessions += 1;
      if (s.status === 'voter_confirmed') o.confirmedVotes += 1;
      o.totalChanges += s.changeCount || 0;
      o.sessions.push({
        sessionId: s.sessionId,
        voterName: s.voterName,
        voterIdStr: s.voterIdStr,
        electionTitle: s.electionTitle,
        status: s.status,
        changeCount: s.changeCount,
        receiptId: s.receiptId,
        events: s.events,
        startedAt: s.startedAt,
        createdAt: s.createdAt
      });
    }

    const officers = Object.values(officerMap).map(o => ({
      ...o,
      changeRate: o.confirmedVotes > 0
        ? parseFloat(((o.totalChanges / o.confirmedVotes) * 100).toFixed(1))
        : 0,
      flagged: o.confirmedVotes > 0 && (o.totalChanges / o.confirmedVotes) > 0.15
    }));

    // Sort flagged officers first
    officers.sort((a, b) => b.changeRate - a.changeRate);

    res.json({ success: true, officers, totalSessions: sessions.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addCandidate, getCandidates, updateCandidate, deleteCandidate,
  createElection, getElections, updateElectionStatus,
  addOfficer, getOfficers,
  addOffice, getOffices,
  getDashboard,
  getOfficerAuditStats
};
