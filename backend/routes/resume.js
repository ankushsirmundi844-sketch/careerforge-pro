const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
} = require('../controllers/resumeController');
const { downloadPDF } = require('../controllers/pdfController');

router.use(protect);

router.get('/', getResumes);
router.post('/', createResume);
router.get('/:id', getResume);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);
router.post('/:id/download-pdf', downloadPDF);

module.exports = router;
