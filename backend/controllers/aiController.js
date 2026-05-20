const Resume = require('../models/Resume');
const aiService = require('../services/aiService');

// POST /api/ai/analyze-jd
exports.analyzeJD = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });
    const result = await aiService.analyzeJD(jobDescription);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/rewrite-bullet
exports.rewriteBullet = async (req, res) => {
  try {
    const { bullet, keywords, role } = req.body;
    if (!bullet) return res.status(400).json({ error: 'Bullet point is required' });
    const rewritten = await aiService.rewriteBullet(bullet, keywords || [], role || 'professional');
    res.json({ rewritten });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/optimize-resume/:id
exports.optimizeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    // Pro check for full optimization
    if (req.user.plan !== 'pro' && resume.experience.length > 1) {
      return res.status(403).json({
        error: 'Full resume optimization requires Pro plan.',
        upgradeUrl: '/pricing',
      });
    }

    // 1. Analyze JD
    const jdKeywords = await aiService.analyzeJD(jobDescription);

    // 2. Optimize experience bullets
    const optimizedExperience = await aiService.optimizeExperience(
      resume.experience,
      jdKeywords,
      jdKeywords.jobTitle
    );

    // 3. Generate new summary
    const optimizedSummary = await aiService.generateSummary(resume, jobDescription, jdKeywords);

    // 4. Calculate ATS score
    const resumeText = aiService.flattenResumeToText(resume);
    const { score, keywords } = aiService.calculateATSScore(resumeText, jdKeywords);

    // 5. Save
    resume.experience = optimizedExperience;
    resume.personalInfo.summary = optimizedSummary;
    resume.atsScore = score;
    resume.targetJD = jobDescription;
    resume.extractedKeywords = keywords;
    resume.lastOptimizedAt = new Date();
    await resume.save();

    res.json({ resume, jdKeywords, atsScore: score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/cover-letter/:id
exports.generateCoverLetter = async (req, res) => {
  try {
    if (req.user.plan !== 'pro') {
      return res.status(403).json({ error: 'Cover letter generation requires Pro plan.', upgradeUrl: '/pricing' });
    }
    const { jobDescription, companyName } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const coverLetter = await aiService.generateCoverLetter(resume, jobDescription, companyName);
    res.json({ coverLetter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/ats-score/:id
exports.getATSScore = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const jdKeywords = await aiService.analyzeJD(jobDescription);
    const resumeText = aiService.flattenResumeToText(resume);
    const { score, keywords } = aiService.calculateATSScore(resumeText, jdKeywords);

    res.json({ score, keywords, jdKeywords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
