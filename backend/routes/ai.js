const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  analyzeJD,
  rewriteBullet,
  optimizeResume,
  generateCoverLetter,
  getATSScore,
} = require('../controllers/aiController');

router.use(protect);

router.post('/analyze-jd', analyzeJD);
router.post('/rewrite-bullet', rewriteBullet);
router.post('/optimize-resume/:id', optimizeResume);
router.post('/cover-letter/:id', generateCoverLetter);
router.post('/ats-score/:id', getATSScore);

module.exports = router;
