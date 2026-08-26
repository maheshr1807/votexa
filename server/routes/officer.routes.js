const express = require('express');
const router = express.Router();
const {
  searchVoter,
  getVoterFaceEmbedding,
  startVoteSession,
  selectCandidate,
  getSessionStatus,
  voterRequestChange,
  voterConfirmVote,
  abandonSession,
  castOfflineVote
} = require('../controllers/officer.controller');
const { getActiveElection } = require('../controllers/voter.controller');
const { protect, restrictTo } = require('../middleware/auth');

// ── Protected officer routes ──────────────────────────────────────────────────
router.use('/election',         protect, restrictTo('officer', 'admin'));
router.use('/search',           protect, restrictTo('officer', 'admin'));
router.use('/face',             protect, restrictTo('officer', 'admin'));
router.use('/vote',             protect, restrictTo('officer', 'admin'));
router.use('/session/start',    protect, restrictTo('officer', 'admin'));
router.use('/session/select',   protect, restrictTo('officer', 'admin'));
router.use('/session/abandon',  protect, restrictTo('officer', 'admin'));

router.get('/election', getActiveElection);
router.get('/search/:voterId', searchVoter);
router.get('/face/:voterId', getVoterFaceEmbedding);
router.post('/vote', castOfflineVote);

// ── Session routes ────────────────────────────────────────────────────────────
// Officer-authenticated:
router.post('/session/start',   startVoteSession);
router.post('/session/select',  selectCandidate);
router.post('/session/abandon', abandonSession);

// Public (voter screen has no JWT token — uses sessionId as identifier):
router.get('/session/:sessionId',  getSessionStatus);
router.post('/session/change',     voterRequestChange);
router.post('/session/confirm',    voterConfirmVote);

module.exports = router;
