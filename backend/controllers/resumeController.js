const Resume = require('../models/Resume');
const User = require('../models/User');

// GET all resumes for logged-in user
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single resume
exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE new resume
exports.createResume = async (req, res) => {
  try {
    const user = req.user;

    // Free plan: max 1 resume
    if (user.plan === 'free' && user.resumeCount >= 1) {
      return res.status(403).json({
        error: 'Free plan allows only 1 resume. Upgrade to Pro for unlimited resumes.',
        upgradeUrl: '/pricing',
      });
    }

    const resume = await Resume.create({ ...req.body, userId: user._id });
    await User.findByIdAndUpdate(user._id, { $inc: { resumeCount: 1 } });
    res.status(201).json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE resume
exports.updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE resume
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    await User.findByIdAndUpdate(req.user._id, { $inc: { resumeCount: -1 } });
    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
