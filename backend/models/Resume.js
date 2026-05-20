const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company:    { type: String },
  role:       { type: String },
  startDate:  { type: String },
  endDate:    { type: String },
  current:    { type: Boolean, default: false },
  bullets:    [{ type: String }],
});

const educationSchema = new mongoose.Schema({
  institution: { type: String },
  degree:      { type: String },
  field:       { type: String },
  startDate:   { type: String },
  endDate:     { type: String },
  gpa:         { type: String },
});

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:  { type: String, default: 'My Resume' },
  template: { type: String, enum: ['classic', 'modern', 'minimal', 'executive'], default: 'classic' },

  // Personal Info
  personalInfo: {
    fullName:  { type: String },
    email:     { type: String },
    phone:     { type: String },
    location:  { type: String },
    linkedin:  { type: String },
    github:    { type: String },
    website:   { type: String },
    summary:   { type: String },
  },

  experience:  [experienceSchema],
  education:   [educationSchema],
  skills:      [{ type: String }],
  certifications: [{ name: String, issuer: String, date: String }],
  projects: [{
    name: String,
    description: String,
    techStack: [String],
    link: String,
  }],

  // ATS & AI data
  atsScore:       { type: Number, default: 0 },
  targetJD:       { type: String },
  extractedKeywords: [{ keyword: String, found: Boolean }],
  lastOptimizedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

resumeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
