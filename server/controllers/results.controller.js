const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const Voter = require('../models/Voter');

/**
 * @desc    Get election results
 * @route   GET /api/results/:electionId
 * @access  Public (after election ends) / Admin always
 */
const getResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });

    const candidates = await Candidate.find({ electionId }).sort({ voteCount: -1 });
    const totalVoters = await Voter.countDocuments();
    const votes = await Vote.find({ electionId });

    const winner = candidates[0] || null;
    const totalVotes = election.totalVotes;
    const turnoutPercent = totalVoters ? ((totalVotes / totalVoters) * 100).toFixed(1) : 0;

    // Build chart data
    const chartData = candidates.map(c => ({
      id: c._id,
      name: c.name,
      party: c.party,
      photo: c.photo,
      votes: c.voteCount,
      percentage: totalVotes ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      election,
      winner,
      totalVoters,
      totalVotes,
      onlineVotes: election.onlineVotes,
      offlineVotes: election.offlineVotes,
      turnoutPercent,
      chartData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all ended elections (for public results page)
 * @route   GET /api/results
 * @access  Public
 */
const getAllResults = async (req, res) => {
  try {
    const elections = await Election.find({ status: 'ended' }).sort({ updatedAt: -1 });
    res.json({ success: true, elections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Export results as JSON (client handles PDF/Excel conversion)
 * @route   GET /api/results/:electionId/export
 * @access  Private (admin)
 */
const exportResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });

    const candidates = await Candidate.find({ electionId }).sort({ voteCount: -1 });
    const totalVotes = election.totalVotes;

    const exportData = {
      election: {
        title: election.title,
        status: election.status,
        totalVotes,
        onlineVotes: election.onlineVotes,
        offlineVotes: election.offlineVotes
      },
      candidates: candidates.map((c, i) => ({
        rank: i + 1,
        name: c.name,
        party: c.party,
        votes: c.voteCount,
        percentage: totalVotes ? ((c.voteCount / totalVotes) * 100).toFixed(2) + '%' : '0%'
      })),
      generatedAt: new Date().toISOString()
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, getAllResults, exportResults };
