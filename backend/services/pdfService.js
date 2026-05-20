const puppeteer = require('puppeteer');

/**
 * Generate a pixel-perfect PDF from an HTML resume template string.
 * @param {string} htmlContent - Fully rendered HTML of the resume
 * @returns {Buffer} PDF buffer
 */
exports.generateResumePDF = async (htmlContent) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for fonts/styles to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Set A4 viewport
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Wrap resume data into a styled HTML string for Puppeteer rendering
 * Template: 'classic' | 'modern' | 'minimal' | 'executive'
 */
exports.buildResumeHTML = (resume, template = 'classic') => {
  const { personalInfo: p, experience, education, skills, certifications, projects } = resume;

  const styles = {
    classic: `
      body { font-family: 'Georgia', serif; color: #222; margin: 0; padding: 40px 50px; font-size: 13px; }
      h1 { font-size: 26px; margin: 0; color: #1a1a2e; }
      h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #1a1a2e; padding-bottom: 4px; margin-top: 20px; color: #1a1a2e; }
      .contact { color: #555; font-size: 12px; margin: 4px 0 16px; }
      .entry-header { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; }
      .entry-sub { color: #555; font-size: 12px; margin-bottom: 4px; }
      ul { margin: 4px 0; padding-left: 18px; }
      li { margin-bottom: 3px; line-height: 1.5; }
      .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .skill-tag { background: #f0f0f0; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
    `,
    modern: `
      body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; font-size: 13px; display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
      .sidebar { background: #1a1a2e; color: white; padding: 30px 24px; }
      .main { padding: 30px 36px; }
      h1 { font-size: 24px; margin: 0 0 4px; color: white; }
      .sidebar h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #a0b4cc; border-bottom: 1px solid #a0b4cc; padding-bottom: 4px; margin-top: 24px; }
      .main h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #1a1a2e; padding-bottom: 4px; margin-top: 22px; color: #1a1a2e; }
      .contact-item { font-size: 12px; margin: 6px 0; color: #cdd5e0; }
      .entry-header { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; }
      .entry-sub { color: #777; font-size: 12px; margin-bottom: 4px; }
      ul { margin: 4px 0; padding-left: 18px; }
      li { margin-bottom: 3px; line-height: 1.5; }
      .skill-tag { display: block; margin: 5px 0; font-size: 12px; color: #cdd5e0; }
    `,
    minimal: `
      body { font-family: 'Helvetica Neue', sans-serif; color: #111; margin: 0; padding: 50px 60px; font-size: 13px; }
      h1 { font-size: 28px; margin: 0; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; }
      h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #888; margin-top: 28px; margin-bottom: 10px; }
      .contact { color: #888; font-size: 11px; margin: 6px 0 20px; letter-spacing: 1px; }
      .entry-header { display: flex; justify-content: space-between; font-weight: 600; margin-top: 12px; }
      .entry-sub { color: #888; font-size: 11px; margin-bottom: 5px; }
      ul { margin: 4px 0; padding-left: 16px; }
      li { margin-bottom: 4px; line-height: 1.6; color: #333; }
      .skills-list { color: #444; line-height: 2; }
    `,
  };

  const css = styles[template] || styles.classic;

  const expHTML = (experience || []).map((e) => `
    <div class="entry-header"><span>${e.role}</span><span>${e.startDate} – ${e.current ? 'Present' : e.endDate}</span></div>
    <div class="entry-sub">${e.company}</div>
    <ul>${(e.bullets || []).map((b) => `<li>${b}</li>`).join('')}</ul>
  `).join('');

  const eduHTML = (education || []).map((e) => `
    <div class="entry-header"><span>${e.degree}${e.field ? ` in ${e.field}` : ''}</span><span>${e.startDate} – ${e.endDate}</span></div>
    <div class="entry-sub">${e.institution}${e.gpa ? ` | GPA: ${e.gpa}` : ''}</div>
  `).join('');

  const skillsHTML = (skills || []).map((s) =>
    template === 'modern' ? `<span class="skill-tag">${s}</span>` : `<span class="skill-tag">${s}</span>`
  ).join('');

  const certHTML = (certifications || []).length ? `
    <h2>Certifications</h2>
    <ul>${certifications.map((c) => `<li>${c.name}${c.issuer ? ` – ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}</li>`).join('')}</ul>
  ` : '';

  const projHTML = (projects || []).length ? `
    <h2>Projects</h2>
    ${projects.map((pr) => `
      <div class="entry-header"><span>${pr.name}</span></div>
      <div class="entry-sub">${(pr.techStack || []).join(', ')}</div>
      <p style="margin:4px 0">${pr.description}</p>
    `).join('')}
  ` : '';

  if (template === 'modern') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
      <div class="sidebar">
        <h1>${p.fullName || ''}</h1>
        <div class="contact-item">${p.email || ''}</div>
        <div class="contact-item">${p.phone || ''}</div>
        <div class="contact-item">${p.location || ''}</div>
        ${p.linkedin ? `<div class="contact-item">${p.linkedin}</div>` : ''}
        ${p.github ? `<div class="contact-item">${p.github}</div>` : ''}
        <h2>Skills</h2>
        ${(skills || []).map((s) => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
      <div class="main">
        ${p.summary ? `<p style="margin-top:0;line-height:1.6">${p.summary}</p>` : ''}
        <h2>Experience</h2>${expHTML}
        <h2>Education</h2>${eduHTML}
        ${certHTML}${projHTML}
      </div>
    </body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
    <h1>${p.fullName || ''}</h1>
    <div class="contact">${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).join(' | ')}</div>
    ${p.summary ? `<h2>Summary</h2><p style="margin:4px 0;line-height:1.6">${p.summary}</p>` : ''}
    <h2>Experience</h2>${expHTML}
    <h2>Education</h2>${eduHTML}
    <h2>Skills</h2>
    <div class="skills-list">${skillsHTML}</div>
    ${certHTML}${projHTML}
  </body></html>`;
};
