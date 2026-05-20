const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract and rank keywords from a Job Description
 */
exports.analyzeJD = async (jobDescription) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert ATS (Applicant Tracking System) analyst.
Analyze the following Job Description and extract the most important keywords.

Categorize them as:
1. MUST-HAVE: Core technical skills, tools, languages explicitly required
2. NICE-TO-HAVE: Preferred or mentioned but not mandatory
3. SOFT SKILLS: Leadership, communication, teamwork, etc.

Return ONLY a valid JSON object in this exact format:
{
  "mustHave": ["keyword1", "keyword2"],
  "niceToHave": ["keyword1", "keyword2"],
  "softSkills": ["keyword1", "keyword2"],
  "jobTitle": "extracted job title",
  "seniorityLevel": "junior/mid/senior/lead"
}

Job Description:
${jobDescription}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

/**
 * Rewrite a resume bullet point to include target keywords
 */
exports.rewriteBullet = async (originalBullet, keywords, role) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a professional resume writer specializing in ATS optimization.

Rewrite the following resume bullet point for a ${role} role.
Requirements:
- Naturally incorporate these keywords where relevant: ${keywords.join(', ')}
- Start with a strong action verb
- Quantify impact where possible (use realistic placeholders like "X%" or "N+ users" if no data given)
- Keep it to 1-2 lines max
- Sound authoritative and professional
- Do NOT add skills not implied by the original bullet

Original bullet: "${originalBullet}"

Return ONLY the rewritten bullet point text, nothing else.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

/**
 * Rewrite entire resume experience section to match JD
 */
exports.optimizeExperience = async (experience, jdKeywords, role) => {
  const optimized = [];
  for (const exp of experience) {
    const newBullets = [];
    for (const bullet of exp.bullets) {
      const rewritten = await exports.rewriteBullet(bullet, jdKeywords.mustHave, role);
      newBullets.push(rewritten);
    }
    optimized.push({ ...exp.toObject ? exp.toObject() : exp, bullets: newBullets });
  }
  return optimized;
};

/**
 * Generate a professional summary tailored to the JD
 */
exports.generateSummary = async (resumeData, jobDescription, jdKeywords) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a professional resume writer.
Write a compelling 3-4 sentence professional summary for a resume.

Candidate background:
- Name: ${resumeData.personalInfo.fullName}
- Current/Most Recent Role: ${resumeData.experience[0]?.role || 'Professional'}
- Top Skills: ${resumeData.skills.slice(0, 8).join(', ')}
- Years of Experience: approximately ${resumeData.experience.length * 2} years

Target Job Description Summary: ${jobDescription.substring(0, 500)}
Must include keywords: ${jdKeywords.mustHave.slice(0, 5).join(', ')}

Rules:
- Do NOT use first person (no "I" or "my")
- Include 2-3 must-have keywords naturally
- Sound confident and specific
- Return ONLY the summary text, no quotes or labels`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

/**
 * Generate a cover letter
 */
exports.generateCoverLetter = async (resumeData, jobDescription, companyName) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert cover letter writer.
Write a professional, compelling cover letter.

Candidate: ${resumeData.personalInfo.fullName}
Most Recent Role: ${resumeData.experience[0]?.role} at ${resumeData.experience[0]?.company}
Key Skills: ${resumeData.skills.slice(0, 6).join(', ')}
Company: ${companyName || 'the company'}
Job Description: ${jobDescription.substring(0, 800)}

Requirements:
- 3 paragraphs: Opening hook, why you're a fit (use specific examples), closing call-to-action
- Professional but personable tone
- Under 300 words
- Return ONLY the cover letter text`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

/**
 * Calculate ATS score: percentage of JD keywords found in resume text
 */
exports.calculateATSScore = (resumeText, keywords) => {
  const text = resumeText.toLowerCase();
  const allKeywords = [...keywords.mustHave, ...keywords.niceToHave];
  const results = allKeywords.map((kw) => ({
    keyword: kw,
    found: text.includes(kw.toLowerCase()),
  }));
  const foundCount = results.filter((r) => r.found).length;
  const score = Math.round((foundCount / allKeywords.length) * 100);
  return { score, keywords: results };
};

/**
 * Flatten resume data into a single string for ATS scoring
 */
exports.flattenResumeToText = (resume) => {
  const parts = [
    resume.personalInfo?.summary || '',
    resume.skills?.join(' ') || '',
    ...(resume.experience || []).flatMap((e) => [e.role, e.company, ...(e.bullets || [])]),
    ...(resume.education || []).map((e) => `${e.degree} ${e.field} ${e.institution}`),
    ...(resume.certifications || []).map((c) => c.name),
  ];
  return parts.join(' ');
};
