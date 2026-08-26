const express = require('express');
const router = express.Router();
const {
  addCandidate, getCandidates, updateCandidate, deleteCandidate,
  createElection, getElections, updateElectionStatus,
  addOfficer, getOfficers,
  addOffice, getOffices,
  getDashboard,
  getOfficerAuditStats
} = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All admin routes are protected
router.use(protect, restrictTo('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Candidates
router.get('/candidates', getCandidates);
router.post('/candidates', upload.single('photo'), addCandidate);
router.put('/candidates/:id', upload.single('photo'), updateCandidate);
router.delete('/candidates/:id', deleteCandidate);

// Elections
router.get('/elections', getElections);
router.post('/elections', createElection);
router.put('/elections/:id/status', updateElectionStatus);

// Officers
router.get('/officers', getOfficers);
router.post('/officers', addOfficer);

// Government Offices
router.get('/offices', getOffices);
router.post('/offices', addOffice);

// Officer Audit Log
router.get('/officer-audit', getOfficerAuditStats);

module.exports = router;
