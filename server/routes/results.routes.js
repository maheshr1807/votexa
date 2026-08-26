const express = require('express');
const router = express.Router();
const { getResults, getAllResults, exportResults } = require('../controllers/results.controller');
const { protect, restrictTo } = require('../middleware/auth');

// Public: list of ended elections
router.get('/', getAllResults);

// Public: results for a specific election (after it ends)
router.get('/:electionId', getResults);

// Admin only: export data
router.get('/:electionId/export', protect, restrictTo('admin'), exportResults);

module.exports = router;
