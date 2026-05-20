const Resume = require('../models/Resume');
const { generateResumePDF, buildResumeHTML } = require('../services/pdfService');

// POST /api/resume/:id/download-pdf
exports.downloadPDF = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    // Pro required for templates other than 'classic'
    if (resume.template !== 'classic' && req.user.plan !== 'pro') {
      return res.status(403).json({ error: 'Premium templates require Pro plan.', upgradeUrl: '/pricing' });
    }

    const html = buildResumeHTML(resume.toObject(), resume.template);
    const pdfBuffer = await generateResumePDF(html);

    const filename = `${(resume.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_CareerForge.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
