const express = require('express');
const router = express.Router();
const { getActiveElection, getVoterStatus, getFaceEmbedding, castOnlineVote, saveWebAuthn } = require('../controllers/voter.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('voter'));

router.get('/election', getActiveElection);
router.get('/status', getVoterStatus);
router.get('/face-embedding', getFaceEmbedding);
router.post('/vote', castOnlineVote);
router.post('/save-webauthn', saveWebAuthn);

module.exports = router;
