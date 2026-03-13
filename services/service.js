/* ===== Service Page JS ===== */

/* Navbar scroll effect + Back to Top */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
  const btt = document.getElementById('backToTop');
  if (btt) btt.classList.toggle('visible', window.scrollY > 400);
});

/* Mobile nav toggle */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  /* Document checklist progress */
  initDocChecklist();
});

/* FAQ toggle */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

/* Document checklist with progress bar */
function initDocChecklist() {
  const items = document.querySelectorAll('.doc-item');
  const progressFill = document.querySelector('.doc-progress-fill');
  const progressText = document.querySelector('.doc-progress-text');
  if (!items.length) return;

  const total = items.length;

  function updateProgress() {
    const checked = document.querySelectorAll('.doc-item input:checked').length;
    const pct = Math.round((checked / total) * 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = checked + ' of ' + total + ' documents ready (' + pct + '%)';
  }

  items.forEach(item => {
    const cb = item.querySelector('input[type="checkbox"]');
    if (!cb) return;
    cb.addEventListener('change', () => {
      item.classList.toggle('checked', cb.checked);
      updateProgress();
    });
    item.addEventListener('click', (e) => {
      if (e.target === cb || e.target.tagName === 'LABEL') return;
      cb.checked = !cb.checked;
      item.classList.toggle('checked', cb.checked);
      updateProgress();
    });
  });

  updateProgress();
}

// ===== WhatsApp Button — Show After Scroll =====
const whatsappBtn = document.getElementById('whatsappFloat');
if (whatsappBtn) {
  whatsappBtn.style.opacity = '0';
  whatsappBtn.style.pointerEvents = 'none';
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      whatsappBtn.style.opacity = '1';
      whatsappBtn.style.pointerEvents = 'auto';
    } else {
      whatsappBtn.style.opacity = '0';
      whatsappBtn.style.pointerEvents = 'none';
    }
  });
}

// ===== Scroll Reveal =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll(
    '.included-item, .timeline-item, .doc-item, .ats-detail-card'
  ).forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${Math.min(i * 0.05, 0.3)}s`;
    revealObserver.observe(el);
  });
});


// =============================================
// ATS RESUME CHECKER
// =============================================
function analyzeATS() {
  const resumeText = document.getElementById('resumeText')?.value?.trim();
  const jobDescText = document.getElementById('jobDescText')?.value?.trim();
  const resultsDiv = document.getElementById('atsResults');

  if (!resultsDiv) return;

  if (!resumeText || !jobDescText) {
    resultsDiv.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:20px;font-weight:600;">Please paste both your resume and the job description to analyze.</p>';
    resultsDiv.style.display = 'block';
    return;
  }

  const stopWords = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was',
    'were','be','been','being','have','has','had','do','does','did','will','would','shall','should',
    'may','might','must','can','could','that','this','these','those','it','its','you','your','we','our',
    'they','their','he','she','his','her','not','no','so','if','then','than','up','out',
    'as','about','into','through','during','before','after','above','below','all','any','both','each',
    'few','more','most','other','some','such','only','own','same','very','just','also','now','new',
    'one','two','three','work','working','job','position','role','company','team','ability','able',
    'experience','required','requirements','please','apply','candidate','including','include','etc',
    'ensure','per','based','well','within','across','using','used','use','make','need','needs',
    'minimum','preferred','strong','excellent','good','knowledge','skills','skill','years','year'
  ]);

  function extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s\-\/\+\#\.]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  const jobKeywords = extractKeywords(jobDescText);
  const resumeKeywords = extractKeywords(resumeText);
  const resumeLower = resumeText.toLowerCase();

  // Unique job keywords by frequency
  const keywordFreq = {};
  jobKeywords.forEach(k => { keywordFreq[k] = (keywordFreq[k] || 0) + 1; });
  const importantKeywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([k]) => k);

  const resumeSet = new Set(resumeKeywords);
  const foundKeywords = importantKeywords.filter(k => resumeSet.has(k) || resumeLower.includes(k));
  const missingKeywords = importantKeywords.filter(k => !resumeSet.has(k) && !resumeLower.includes(k));

  const keywordMatch = importantKeywords.length > 0
    ? Math.round((foundKeywords.length / importantKeywords.length) * 100)
    : 0;

  // Resume length
  const wordCount = resumeText.split(/\s+/).filter(w => w.length > 0).length;
  let lengthScore = 0, lengthIcon = 'fail', lengthMsg = '';
  if (wordCount >= 400 && wordCount <= 700) {
    lengthScore = 20; lengthIcon = 'pass';
    lengthMsg = wordCount + ' words — Ideal length for a 1-page resume';
  } else if (wordCount >= 300 && wordCount <= 900) {
    lengthScore = 15; lengthIcon = 'warn';
    lengthMsg = wordCount + ' words — ' + (wordCount < 400 ? 'Consider adding more detail' : 'Consider trimming');
  } else {
    lengthScore = 5; lengthIcon = 'fail';
    lengthMsg = wordCount + ' words — ' + (wordCount < 300 ? 'Too short, add more content' : 'Too long, trim to 1-2 pages');
  }

  // Contact info
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /[\+]?[\d\s\-\(\)]{7,15}/.test(resumeText);
  let contactScore = 0, contactIcon = 'fail', contactMsg = '';
  if (hasEmail && hasPhone) {
    contactScore = 15; contactIcon = 'pass'; contactMsg = 'Email and phone number detected';
  } else if (hasEmail || hasPhone) {
    contactScore = 10; contactIcon = 'warn';
    contactMsg = hasEmail ? 'Email found, but no phone number detected' : 'Phone found, but no email detected';
  } else {
    contactScore = 0; contactIcon = 'fail'; contactMsg = 'No email or phone number detected — ATS may reject';
  }

  // Section detection
  const sectionPatterns = {
    'Education': /education|academic|degree|university|college|diploma/i,
    'Experience': /experience|employment|work\s*history|professional/i,
    'Skills': /skills|technical|competenc|proficienc|technologies/i,
    'Summary': /summary|objective|profile|about/i,
    'Certifications': /certif|license|accredit/i,
  };
  const foundSections = [], missingSections = [];
  Object.entries(sectionPatterns).forEach(([name, pattern]) => {
    if (pattern.test(resumeText)) foundSections.push(name);
    else missingSections.push(name);
  });

  let sectionScore = Math.min(foundSections.length * 4, 15);
  let sectionIcon = foundSections.length >= 4 ? 'pass' : foundSections.length >= 2 ? 'warn' : 'fail';
  let sectionMsg = 'Found: ' + (foundSections.join(', ') || 'None');
  if (missingSections.length > 0 && foundSections.length < 4) sectionMsg += '. Missing: ' + missingSections.join(', ');

  // Total score
  const keywordScore = Math.round(keywordMatch * 0.5);
  const totalScore = Math.min(keywordScore + lengthScore + contactScore + sectionScore, 100);

  let ratingClass, ratingText;
  if (totalScore >= 80) { ratingClass = 'excellent'; ratingText = 'Excellent — Your resume is well-optimized for ATS'; }
  else if (totalScore >= 60) { ratingClass = 'good'; ratingText = 'Good — Minor improvements needed'; }
  else if (totalScore >= 40) { ratingClass = 'fair'; ratingText = 'Fair — Significant improvements recommended'; }
  else { ratingClass = 'poor'; ratingText = 'Needs Work — Major optimization required'; }

  // Tips
  const tips = [];
  if (keywordMatch < 60) tips.push('Add more keywords from the job description — aim for 60%+ match.');
  if (missingKeywords.length > 5) tips.push('Include missing keywords: ' + missingKeywords.slice(0, 8).join(', ') + '.');
  if (wordCount < 400) tips.push('Your resume is too short. Add details about achievements.');
  if (wordCount > 700) tips.push('Consider trimming your resume to 1 page (400-600 words).');
  if (!hasEmail) tips.push('Add your email address to the contact section.');
  if (!hasPhone) tips.push('Add your phone number to the contact section.');
  if (!sectionPatterns['Summary'].test(resumeText)) tips.push('Add a Professional Summary section at the top.');
  if (!sectionPatterns['Skills'].test(resumeText)) tips.push('Add a dedicated Skills section.');
  tips.push('Use action verbs like "managed," "developed," "implemented."');
  tips.push('Quantify achievements where possible (e.g., "increased sales by 25%").');

  function iconChar(type) {
    return type === 'pass' ? '&#10004;' : type === 'warn' ? '&#9888;' : '&#10060;';
  }

  resultsDiv.innerHTML = `
    <div class="ats-score-header">
      <div class="ats-score-ring ${ratingClass}">
        <span class="ats-score-num">${totalScore}</span>
        <span class="ats-score-of">/ 100</span>
      </div>
      <div class="ats-score-info">
        <h3>${ratingText}</h3>
        <p>Your resume matches <strong>${keywordMatch}%</strong> of the key terms in the job description. ${totalScore >= 60 ? 'Most ATS systems would likely pass your resume through.' : 'Many ATS systems may filter out your resume.'}</p>
      </div>
    </div>
    <div class="ats-details-grid">
      <div class="ats-detail-card">
        <h4><span class="status-${contactIcon}">${iconChar(contactIcon)}</span> Contact Information</h4>
        <p>${contactMsg}</p>
      </div>
      <div class="ats-detail-card">
        <h4><span class="status-${lengthIcon}">${iconChar(lengthIcon)}</span> Resume Length</h4>
        <p>${lengthMsg}</p>
      </div>
      <div class="ats-detail-card">
        <h4><span class="status-${sectionIcon}">${iconChar(sectionIcon)}</span> Resume Sections</h4>
        <p>${sectionMsg}</p>
      </div>
      <div class="ats-detail-card">
        <h4><span class="status-${keywordMatch >= 60 ? 'pass' : keywordMatch >= 35 ? 'warn' : 'fail'}">${iconChar(keywordMatch >= 60 ? 'pass' : keywordMatch >= 35 ? 'warn' : 'fail')}</span> Keyword Match: ${keywordMatch}%</h4>
        <div class="ats-keywords">
          ${foundKeywords.slice(0, 12).map(k => '<span class="ats-keyword found">' + k + '</span>').join('')}
          ${missingKeywords.slice(0, 8).map(k => '<span class="ats-keyword missing">' + k + '</span>').join('')}
        </div>
      </div>
    </div>
    <div class="ats-tips">
      <h4>&#128161; Tips to Improve Your Score</h4>
      <ul>${tips.slice(0, 7).map(t => '<li>' + t + '</li>').join('')}</ul>
    </div>
  `;
  resultsDiv.style.display = 'block';
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
