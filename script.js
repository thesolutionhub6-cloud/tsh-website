// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  if (backToTopBtn) backToTopBtn.classList.toggle('visible', window.scrollY > 400);
});

// ===== Mobile Menu =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// ===== Active Nav on Scroll =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (link) link.classList.toggle('active', scrollY >= top && scrollY < top + height);
  });
});

// ===== Stat Counter Animation =====
const statNumbers = document.querySelectorAll('.stat-number');
let statAnimated = false;
function animateStats() {
  statNumbers.forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const update = () => {
      current += step;
      if (current < target) {
        el.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    };
    update();
  });
}

// ===== Scroll Reveal =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.closest('.hero-stats') && !statAnimated) {
        statAnimated = true;
        animateStats();
      }
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll(
  '.service-card, .pathway-box, .step, .testimonial-card, .contact-item, .hero-stats, .hero-badge, .hero h1, .hero-subtitle, .hero-actions, .pathway-cards, .trust-row'
).forEach((el, i) => {
  el.classList.add('fade-in');
  el.style.transitionDelay = `${Math.min(i * 0.05, 0.4)}s`;
  observer.observe(el);
});

// ===== Smooth Scroll =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    try {
      const target = document.querySelector(href);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    } catch (err) { /* invalid selector */ }
  });
});


// =============================================
// CRS SCORE CALCULATOR
// =============================================
/* ===== SCORE-TO-CLB CONVERSION TABLES ===== */
const langConversion = {
  ielts: {
    name: 'IELTS General Training',
    guide: 'Enter your IELTS band scores (0–9)',
    listening: [[8.5,10],[8,9],[7.5,8],[6,7],[5.5,6],[5,5],[4.5,4]],
    reading:   [[8,10],[7,9],[6.5,8],[6,7],[5,6],[4,5],[3.5,4]],
    writing:   [[7.5,10],[7,9],[6.5,8],[6,7],[5.5,6],[5,5],[4,4]],
    speaking:  [[7.5,10],[7,9],[6.5,8],[6,7],[5.5,6],[5,5],[4,4]],
    min: 0, max: 9, step: 0.5
  },
  celpip: {
    name: 'CELPIP General',
    guide: 'Enter your CELPIP scores (1–12)',
    listening: [[12,12],[11,11],[10,10],[9,9],[8,8],[7,7],[6,6],[5,5],[4,4]],
    reading:   [[12,12],[11,11],[10,10],[9,9],[8,8],[7,7],[6,6],[5,5],[4,4]],
    writing:   [[12,12],[11,11],[10,10],[9,9],[8,8],[7,7],[6,6],[5,5],[4,4]],
    speaking:  [[12,12],[11,11],[10,10],[9,9],[8,8],[7,7],[6,6],[5,5],[4,4]],
    min: 1, max: 12, step: 1
  },
  pte: {
    name: 'PTE Core',
    guide: 'Enter your PTE Core scores (10–90)',
    listening: [[89,10],[82,9],[71,8],[60,7],[50,6],[39,5],[28,4]],
    reading:   [[88,10],[78,9],[69,8],[60,7],[51,6],[42,5],[33,4]],
    writing:   [[90,10],[88,9],[79,8],[69,7],[60,6],[51,5],[41,4]],
    speaking:  [[89,10],[84,9],[76,8],[68,7],[59,6],[51,5],[42,4]],
    min: 10, max: 90, step: 1
  },
  tef: {
    name: 'TEF Canada',
    guide: 'Enter your TEF Canada scores',
    listening: [[546,10],[503,9],[462,8],[434,7],[393,6],[352,5],[306,4]],
    reading:   [[546,10],[503,9],[462,8],[434,7],[393,6],[352,5],[306,4]],
    writing:   [[558,10],[512,9],[472,8],[428,7],[379,6],[330,5],[268,4]],
    speaking:  [[556,10],[518,9],[494,8],[456,7],[422,6],[387,5],[328,4]],
    min: 0, max: 699, step: 1
  },
  tcf: {
    name: 'TCF Canada',
    guide: 'Enter your TCF Canada scores',
    listening: [[549,10],[523,9],[503,8],[458,7],[398,6],[369,5],[331,4]],
    reading:   [[549,10],[524,9],[499,8],[453,7],[406,6],[375,5],[342,4]],
    writing:   [[16,10],[14,9],[12,8],[10,7],[7,6],[6,5],[4,4]],
    speaking:  [[16,10],[14,9],[12,8],[10,7],[7,6],[6,5],[4,4]],
    min: 0, max: 699, step: 1
  }
};

function scoreToClb(testType, skill, score) {
  if (testType === 'clb') return Math.min(12, Math.max(0, Math.round(score)));
  const table = langConversion[testType]?.[skill];
  if (!table) return 0;
  for (const [threshold, clb] of table) {
    if (score >= threshold) return clb;
  }
  return 0;
}

function updateLangInputs() {
  const testType = document.getElementById('crsLangTest').value;
  const guide = document.getElementById('langScoreGuide');
  const refTable = document.getElementById('langRefTable');
  const fields = ['clbListening', 'clbReading', 'clbWriting', 'clbSpeaking'];

  if (testType === 'clb') {
    guide.innerHTML = '<small>Enter CLB level (4-12) for each skill</small>';
    refTable.style.display = 'none';
    fields.forEach(f => {
      const el = document.getElementById(f);
      el.min = 4; el.max = 12; el.step = 1; el.value = 7;
    });
  } else {
    const cfg = langConversion[testType];
    guide.innerHTML = '<small>' + cfg.guide + '</small>';
    refTable.style.display = 'block';
    fields.forEach(f => {
      const el = document.getElementById(f);
      el.min = cfg.min; el.max = cfg.max; el.step = cfg.step;
      el.value = '';
    });
    buildRefTable(testType, 'refTableContent');
  }
  document.getElementById('clbConversionResult').style.display = 'none';
  document.getElementById('clbConvertedValues').textContent = '';
}

/* Live CLB conversion as user types */
function showLiveClbConversion() {
  const testType = document.getElementById('crsLangTest').value;
  if (testType === 'clb') {
    document.getElementById('clbConversionResult').style.display = 'none';
    return;
  }
  const l = scoreToClb(testType, 'listening', parseFloat(document.getElementById('clbListening').value) || 0);
  const r = scoreToClb(testType, 'reading', parseFloat(document.getElementById('clbReading').value) || 0);
  const w = scoreToClb(testType, 'writing', parseFloat(document.getElementById('clbWriting').value) || 0);
  const s = scoreToClb(testType, 'speaking', parseFloat(document.getElementById('clbSpeaking').value) || 0);
  const any = document.getElementById('clbListening').value || document.getElementById('clbReading').value || document.getElementById('clbWriting').value || document.getElementById('clbSpeaking').value;
  if (any) {
    document.getElementById('clbConversionResult').style.display = 'block';
    document.getElementById('clbConvertedValues').textContent =
      '  Listening: CLB ' + l + '  |  Reading: CLB ' + r + '  |  Writing: CLB ' + w + '  |  Speaking: CLB ' + s;
  }
}

function updateLangInputs2() {
  const testType = document.getElementById('crsLangTest2').value;
  const fields = ['clb2Listening', 'clb2Reading', 'clb2Writing', 'clb2Speaking'];
  if (testType === 'clb') {
    fields.forEach(f => { const el = document.getElementById(f); el.min = 0; el.max = 12; el.step = 1; el.value = 0; });
  } else {
    const cfg = langConversion[testType];
    fields.forEach(f => { const el = document.getElementById(f); el.min = cfg.min; el.max = cfg.max; el.step = cfg.step; el.value = ''; });
  }
}

function toggleSecondLang() {
  document.getElementById('secondLangSection').style.display =
    document.getElementById('hasSecondLang').checked ? 'block' : 'none';
}

function buildRefTable(testType, containerId) {
  const cfg = langConversion[testType];
  const skills = ['listening', 'reading', 'writing', 'speaking'];
  let html = '<table class="ref-conversion-table"><thead><tr><th>CLB</th>';
  skills.forEach(s => html += '<th>' + s.charAt(0).toUpperCase() + s.slice(1) + '</th>');
  html += '</tr></thead><tbody>';
  for (let clb = 12; clb >= 4; clb--) {
    html += '<tr><td><strong>' + clb + '</strong></td>';
    skills.forEach(s => {
      const entry = cfg[s].find(e => e[1] === clb);
      html += '<td>' + (entry ? entry[0] + '+' : '-') + '</td>';
    });
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById(containerId).innerHTML = html;
}

/* ===== CRS NAVIGATION ===== */
function crsNext(step) {
  document.querySelectorAll('.calc-step').forEach(s => s.classList.add('hidden'));
  document.getElementById(`calcStep${step}`).classList.remove('hidden');
  document.querySelectorAll('.calc-step-indicator').forEach((ind, i) => {
    ind.classList.remove('active', 'done');
    if (i < step - 1) ind.classList.add('done');
    if (i === step - 1) ind.classList.add('active');
  });
}

function crsBack(step) {
  crsNext(step);
}

/* ===== CRS CALCULATION ===== */
function calculateCRS() {
  const marital = document.getElementById('crsMarital').value;
  const isSingle = marital === 'single';
  const age = parseInt(document.getElementById('crsAge').value) || 0;
  const education = parseInt(document.getElementById('crsEducation').value) || 0;
  const canadianEdu = parseInt(document.getElementById('crsCanadianEdu').value) || 0;
  const canWork = parseInt(document.getElementById('crsCanWork').value) || 0;
  const foreignWork = parseInt(document.getElementById('crsForeignWork').value) || 0;

  // First official language — convert scores to CLB
  const testType = document.getElementById('crsLangTest').value;
  const l1 = scoreToClb(testType, 'listening', parseFloat(document.getElementById('clbListening').value) || 0);
  const r1 = scoreToClb(testType, 'reading', parseFloat(document.getElementById('clbReading').value) || 0);
  const w1 = scoreToClb(testType, 'writing', parseFloat(document.getElementById('clbWriting').value) || 0);
  const s1 = scoreToClb(testType, 'speaking', parseFloat(document.getElementById('clbSpeaking').value) || 0);

  // Show CLB conversion result
  if (testType !== 'clb') {
    const convDiv = document.getElementById('clbConversionResult');
    convDiv.style.display = 'block';
    document.getElementById('clbConvertedValues').textContent =
      'L:' + l1 + ' R:' + r1 + ' W:' + w1 + ' S:' + s1;
  }

  // CRS language points (single applicant table)
  const clbToPoints = { 0:0, 1:0, 2:0, 3:0, 4:6, 5:6, 6:9, 7:17, 8:23, 9:31, 10:34, 11:34, 12:34 };
  const clbToPointsMarried = { 0:0, 1:0, 2:0, 3:0, 4:6, 5:6, 6:8, 7:16, 8:22, 9:29, 10:32, 11:32, 12:32 };
  const pointsTable = isSingle ? clbToPoints : clbToPointsMarried;
  const language = (pointsTable[l1]||0) + (pointsTable[r1]||0) + (pointsTable[w1]||0) + (pointsTable[s1]||0);

  // Second official language bonus
  let secondLangBonus = 0;
  if (document.getElementById('hasSecondLang').checked) {
    const testType2 = document.getElementById('crsLangTest2').value;
    const l2 = scoreToClb(testType2, 'listening', parseFloat(document.getElementById('clb2Listening').value) || 0);
    const r2 = scoreToClb(testType2, 'reading', parseFloat(document.getElementById('clb2Reading').value) || 0);
    const w2 = scoreToClb(testType2, 'writing', parseFloat(document.getElementById('clb2Writing').value) || 0);
    const s2 = scoreToClb(testType2, 'speaking', parseFloat(document.getElementById('clb2Speaking').value) || 0);
    const clb2Arr = [l2, r2, w2, s2];
    const allNclc7 = clb2Arr.every(c => c >= 7);
    const allNclc5 = clb2Arr.every(c => c >= 5);
    if (allNclc7) secondLangBonus = 25;
    else if (allNclc5) secondLangBonus = 13;
  }

  // Bonus points
  let bonus = 0;
  document.querySelectorAll('.bonus-checks input:checked').forEach(cb => {
    const val = parseInt(cb.value);
    if (!isNaN(val)) bonus += val;
  });

  // Skill Transferability cross-factor points (max 100)
  let skillTransfer = 0;
  const minLang = Math.min(l1, r1, w1, s1);

  // Language + Education (max 50)
  if (minLang >= 7 && education >= 112) skillTransfer += 50;
  else if (minLang >= 7 && education >= 84) skillTransfer += 25;
  else if (minLang >= 5 && education >= 112) skillTransfer += 25;
  else if (minLang >= 5 && education >= 84) skillTransfer += 13;

  // Language + Canadian Work (max 50)
  let langWork = 0;
  const canWorkYears = canWork > 0 ? (isSingle ? (canWork >= 80 ? 3 : canWork >= 64 ? 2 : 1) : (canWork >= 72 ? 3 : canWork >= 56 ? 2 : 1)) : 0;
  if (minLang >= 7 && canWorkYears >= 2) langWork = 50;
  else if (minLang >= 7 && canWorkYears >= 1) langWork = 25;
  else if (minLang >= 5 && canWorkYears >= 2) langWork = 25;
  else if (minLang >= 5 && canWorkYears >= 1) langWork = 13;
  skillTransfer += langWork;

  // Education + Canadian Work (max 50)
  let eduWork = 0;
  if (education >= 112 && canWorkYears >= 2) eduWork = 50;
  else if (education >= 112 && canWorkYears >= 1) eduWork = 25;
  else if (education >= 84 && canWorkYears >= 2) eduWork = 25;
  else if (education >= 84 && canWorkYears >= 1) eduWork = 13;
  skillTransfer += eduWork;

  // Foreign Work + Language (max 50)
  const foreignWorkYears = foreignWork > 0 ? (foreignWork >= 50 ? 3 : foreignWork >= 25 ? 2 : 1) : 0;
  let foreignLang = 0;
  if (minLang >= 7 && foreignWorkYears >= 3) foreignLang = 50;
  else if (minLang >= 7 && foreignWorkYears >= 1) foreignLang = 25;
  else if (minLang >= 5 && foreignWorkYears >= 3) foreignLang = 25;
  else if (minLang >= 5 && foreignWorkYears >= 1) foreignLang = 13;
  skillTransfer += foreignLang;

  // Foreign Work + Canadian Work (max 50)
  let foreignCan = 0;
  if (foreignWorkYears >= 3 && canWorkYears >= 2) foreignCan = 50;
  else if (foreignWorkYears >= 1 && canWorkYears >= 2) foreignCan = 25;
  else if (foreignWorkYears >= 3 && canWorkYears >= 1) foreignCan = 25;
  else if (foreignWorkYears >= 1 && canWorkYears >= 1) foreignCan = 13;
  skillTransfer += foreignCan;

  // Cap Skill Transferability at 100
  skillTransfer = Math.min(100, skillTransfer);

  const core = age + education + language + canWork;
  const additional = foreignWork + canadianEdu + secondLangBonus + skillTransfer;
  const total = core + additional + bonus;

  // Display result
  document.querySelectorAll('.calc-step').forEach(s => s.classList.add('hidden'));
  const resultDiv = document.getElementById('crsResult');
  resultDiv.classList.remove('hidden');

  // Animate score
  const scoreEl = document.getElementById('crsScoreValue');
  let current = 0;
  const inc = total / (1500 / 16);
  const animate = () => {
    current += inc;
    if (current < total) {
      scoreEl.textContent = Math.floor(current);
      requestAnimationFrame(animate);
    } else {
      scoreEl.textContent = total;
    }
  };
  animate();

  // Rating with tips
  const ratingEl = document.getElementById('crsRating');
  if (total >= 500) {
    ratingEl.innerHTML = '<span class="rating-badge excellent">Excellent</span> Strong chance of receiving an ITA in the next draw';
    ratingEl.className = 'crs-rating';
  } else if (total >= 450) {
    ratingEl.innerHTML = '<span class="rating-badge good">Good</span> Competitive score — consider PNP for a 600-point boost';
    ratingEl.className = 'crs-rating';
  } else if (total >= 400) {
    ratingEl.innerHTML = '<span class="rating-badge fair">Fair</span> Improve language scores or get PNP nomination to boost your CRS';
    ratingEl.className = 'crs-rating';
  } else {
    ratingEl.innerHTML = '<span class="rating-badge below">Needs Improvement</span> Let us help you identify the best strategy to boost your score';
    ratingEl.className = 'crs-rating';
  }

  // CLB info for breakdown
  const clbStr = testType === 'clb' ? 'CLB ' + l1 + '/' + r1 + '/' + w1 + '/' + s1
    : langConversion[testType].name + ' (CLB ' + l1 + '/' + r1 + '/' + w1 + '/' + s1 + ')';

  // Breakdown
  document.getElementById('crsBreakdown').innerHTML = `
    <div class="breakdown-section"><span class="breakdown-header">Core Human Capital</span></div>
    <div><span>Age</span><span>${age}</span></div>
    <div><span>Education</span><span>${education}</span></div>
    <div><span>1st Language — ${clbStr}</span><span>${language}</span></div>
    <div><span>Canadian Work Experience</span><span>${canWork}</span></div>
    <div class="breakdown-subtotal"><span>Core Total</span><span>${core}</span></div>
    <div class="breakdown-section"><span class="breakdown-header">Additional Factors</span></div>
    <div><span>Foreign Work Experience</span><span>${foreignWork}</span></div>
    <div><span>Canadian Education</span><span>${canadianEdu}</span></div>
    ${secondLangBonus > 0 ? '<div><span>2nd Language Bonus</span><span>' + secondLangBonus + '</span></div>' : ''}
    ${skillTransfer > 0 ? '<div><span>Skill Transferability</span><span>' + skillTransfer + '</span></div>' : ''}
    <div class="breakdown-subtotal"><span>Additional Total</span><span>${additional}</span></div>
    ${bonus > 0 ? '<div class="breakdown-section"><span class="breakdown-header">Bonus Points</span></div><div><span>PNP / Job Offer / Other</span><span>' + bonus + '</span></div>' : ''}
    <div class="breakdown-total"><span>Total CRS Score</span><span>${total} / 1200</span></div>
  `;
}

function resetCRS() {
  document.getElementById('crsResult').classList.add('hidden');
  crsNext(1);
  document.getElementById('crsAge').value = '0';
  document.getElementById('crsMarital').value = 'single';
  document.getElementById('crsEducation').value = '0';
  document.getElementById('crsCanadianEdu').value = '0';
  document.getElementById('crsCanWork').value = '0';
  document.getElementById('crsForeignWork').value = '0';
  document.getElementById('crsLangTest').value = 'clb';
  updateLangInputs();
  document.getElementById('clbListening').value = '7';
  document.getElementById('clbReading').value = '7';
  document.getElementById('clbWriting').value = '7';
  document.getElementById('clbSpeaking').value = '7';
  document.getElementById('hasSecondLang').checked = false;
  toggleSecondLang();
  document.querySelectorAll('.bonus-checks input').forEach(cb => cb.checked = false);
  document.getElementById('clbConversionResult').style.display = 'none';
}


// =============================================
// DRAW TRACKER FILTER
// =============================================
document.querySelectorAll('.draw-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.draw-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    document.querySelectorAll('#drawCards .draw-card').forEach(card => {
      if (filter === 'all') {
        card.classList.remove('hidden-row');
      } else {
        const type = card.getAttribute('data-type');
        card.classList.toggle('hidden-row', type !== filter);
      }
    });
  });
});

function checkScoreVsDraw() {
  const score = parseInt(document.getElementById('checkScoreInput').value);
  const resultEl = document.getElementById('scoreCheckResult');
  if (!score || score < 0 || score > 1200) {
    resultEl.textContent = 'Please enter a valid CRS score (0–1200)';
    resultEl.className = 'score-check-result';
    return;
  }
  const latestCutoff = 524; // Draw #298
  const diff = score - latestCutoff;
  if (diff >= 0) {
    resultEl.textContent = `Your score of ${score} is ${diff} points ABOVE the latest cutoff of ${latestCutoff}. You would have received an ITA!`;
    resultEl.className = 'score-check-result above';
  } else {
    resultEl.textContent = `Your score of ${score} is ${Math.abs(diff)} points BELOW the latest cutoff of ${latestCutoff}. Consider improvement strategies or PNP nomination.`;
    resultEl.className = 'score-check-result below';
  }
}


// =============================================
// NOC CODE FINDER — COMPREHENSIVE DATABASE
// =============================================
const nocDatabase = [
  // ===== HEALTHCARE =====
  { code:'31100', title:'Specialist Physician', cat:'Healthcare', teer:0, eligible:true, wage:'$120k–$350k+', desc:'Diagnose and treat diseases and injuries as medical specialists.', subs:['Cardiologist','Dermatologist','Psychiatrist','Anesthesiologist','Radiologist','Surgeon','Neurologist','Oncologist','Orthopedic Surgeon','Urologist'] },
  { code:'31102', title:'General Practitioner / Family Physician', cat:'Healthcare', teer:1, eligible:true, wage:'$100k–$250k', desc:'Examine patients, order tests, prescribe treatment, and provide primary healthcare.', subs:['Family Doctor','GP','Walk-in Clinic Doctor','Community Physician'] },
  { code:'31200', title:'Dentist', cat:'Healthcare', teer:1, eligible:true, wage:'$100k–$300k', desc:'Diagnose, treat, and prevent diseases and disorders of the teeth and mouth.', subs:['General Dentist','Orthodontist','Oral Surgeon','Pediatric Dentist','Endodontist'] },
  { code:'31301', title:'Registered Nurse (RN)', cat:'Healthcare', teer:1, eligible:true, wage:'$65k–$95k', desc:'Provide direct nursing care to patients in hospitals, clinics, and community settings.', subs:['Staff Nurse','ICU Nurse','ER Nurse','Surgical Nurse','Community Health Nurse','Public Health Nurse','Nurse Educator'] },
  { code:'31302', title:'Nurse Practitioner', cat:'Healthcare', teer:1, eligible:true, wage:'$90k–$120k', desc:'Provide advanced nursing care, diagnose illnesses, prescribe medications.', subs:['Primary Care NP','Acute Care NP','Family Nurse Practitioner','Pediatric NP'] },
  { code:'31303', title:'Licensed Practical Nurse (LPN)', cat:'Healthcare', teer:2, eligible:true, wage:'$45k–$60k', desc:'Provide basic nursing care under the supervision of registered nurses and physicians.', subs:['Practical Nurse','LPN','Nursing Assistant','Clinic LPN','Long-term Care LPN'] },
  { code:'32101', title:'Medical Laboratory Technologist', cat:'Healthcare', teer:2, eligible:true, wage:'$55k–$80k', desc:'Conduct lab tests to assist in diagnosis and treatment of disease.', subs:['Lab Technologist','Blood Bank Technologist','Histotechnologist','Cytotechnologist','Medical Lab Tech'] },
  { code:'32102', title:'Paramedic / Emergency Medical Technician', cat:'Healthcare', teer:2, eligible:true, wage:'$55k–$90k', desc:'Provide emergency pre-hospital medical care and transport patients.', subs:['Paramedic','EMT','Advanced Care Paramedic','Primary Care Paramedic','Flight Paramedic'] },
  { code:'32103', title:'Respiratory Therapist', cat:'Healthcare', teer:2, eligible:true, wage:'$55k–$80k', desc:'Assess, treat, and care for patients with breathing and cardiopulmonary disorders.', subs:['Respiratory Therapist','Pulmonary Function Technologist','Ventilator Technician'] },
  { code:'31112', title:'Pharmacist', cat:'Healthcare', teer:1, eligible:true, wage:'$80k–$120k', desc:'Dispense prescribed medications, provide pharmaceutical advice and drug information.', subs:['Retail Pharmacist','Hospital Pharmacist','Clinical Pharmacist','Pharmacy Manager'] },
  { code:'31121', title:'Optometrist', cat:'Healthcare', teer:1, eligible:true, wage:'$80k–$150k', desc:'Examine eyes, diagnose vision problems, prescribe corrective lenses.', subs:['Optometrist','Eye Doctor','Vision Specialist'] },
  { code:'31202', title:'Physiotherapist', cat:'Healthcare', teer:1, eligible:true, wage:'$65k–$95k', desc:'Assess and treat physical disorders and injuries to restore mobility.', subs:['Physical Therapist','Sports Physiotherapist','Rehabilitation Therapist','Neuro Physiotherapist'] },
  { code:'31203', title:'Occupational Therapist', cat:'Healthcare', teer:1, eligible:true, wage:'$60k–$90k', desc:'Help patients develop, recover, and improve skills needed for daily living and working.', subs:['OT','Rehab Occupational Therapist','Pediatric OT','Mental Health OT'] },
  { code:'33102', title:'Personal Support Worker (PSW)', cat:'Healthcare', teer:3, eligible:true, wage:'$32k–$45k', desc:'Assist patients with daily living activities in healthcare facilities, group homes, or private residences.', subs:['PSW','Home Care Aide','Resident Care Aide','Health Care Aide','Patient Attendant','Continuing Care Assistant'] },
  { code:'33109', title:'Developmental Service Worker (DSW)', cat:'Healthcare', teer:3, eligible:true, wage:'$35k–$50k', desc:'Provide support to individuals with developmental disabilities in community and residential settings.', subs:['DSW','Community Support Worker','Behavioral Support Worker','Disability Support Worker'] },
  { code:'32120', title:'Dental Hygienist', cat:'Healthcare', teer:2, eligible:true, wage:'$60k–$90k', desc:'Clean teeth, examine oral areas, and provide preventive dental care.', subs:['Dental Hygienist','Oral Health Educator','Clinical Dental Hygienist'] },
  { code:'33100', title:'Dental Assistant', cat:'Healthcare', teer:3, eligible:true, wage:'$35k–$50k', desc:'Assist dentists during procedures, sterilize instruments, and prepare patients.', subs:['Dental Assistant','Chairside Assistant','Dental Office Assistant'] },
  { code:'31204', title:'Audiologist / Speech-Language Pathologist', cat:'Healthcare', teer:1, eligible:true, wage:'$65k–$100k', desc:'Diagnose and treat hearing, speech, and language disorders.', subs:['Audiologist','Speech Therapist','Speech-Language Pathologist','SLP'] },
  { code:'32109', title:'Medical Radiation Technologist', cat:'Healthcare', teer:2, eligible:true, wage:'$55k–$85k', desc:'Operate radiological equipment to produce images for medical diagnosis.', subs:['X-ray Technologist','MRI Technologist','CT Technologist','Nuclear Medicine Technologist','Radiation Therapist'] },
  { code:'31110', title:'Veterinarian', cat:'Healthcare', teer:1, eligible:true, wage:'$70k–$120k', desc:'Diagnose and treat diseases and injuries in animals.', subs:['Veterinarian','Animal Doctor','Vet Surgeon','Emergency Vet','Equine Vet'] },
  { code:'32104', title:'Pharmacy Technician', cat:'Healthcare', teer:2, eligible:true, wage:'$38k–$55k', desc:'Prepare and dispense medications under pharmacist supervision.', subs:['Pharmacy Technician','Pharmacy Tech','Compounding Technician','Hospital Pharmacy Tech'] },

  // ===== INFORMATION TECHNOLOGY =====
  { code:'21232', title:'Software Developer / Engineer', cat:'IT', teer:1, eligible:true, wage:'$70k–$140k', desc:'Design, develop, test, and maintain software applications and systems.', subs:['Frontend Developer','Backend Developer','Full Stack Developer','Mobile Developer','Game Developer','DevOps Engineer','Software Architect','Application Developer'] },
  { code:'21211', title:'Data Analyst / Data Scientist', cat:'IT', teer:1, eligible:true, wage:'$60k–$130k', desc:'Collect, analyze, and interpret complex data sets to help organizations make decisions.', subs:['Data Analyst','Data Scientist','Business Intelligence Analyst','Data Engineer','Machine Learning Engineer','AI Specialist','Analytics Consultant'] },
  { code:'21220', title:'Cybersecurity Analyst', cat:'IT', teer:1, eligible:true, wage:'$70k–$130k', desc:'Plan and implement security measures to protect computer networks and systems.', subs:['Security Analyst','Information Security Specialist','Penetration Tester','SOC Analyst','Security Engineer','Cybersecurity Consultant'] },
  { code:'21222', title:'Information Systems Specialist', cat:'IT', teer:1, eligible:true, wage:'$65k–$110k', desc:'Analyze system requirements, design solutions, and implement IT systems.', subs:['Systems Analyst','IT Consultant','ERP Specialist','Solutions Architect','IT Business Analyst'] },
  { code:'21231', title:'Web Developer / Designer', cat:'IT', teer:1, eligible:true, wage:'$50k–$100k', desc:'Design, develop, and maintain websites and web applications.', subs:['Web Developer','Web Designer','UX/UI Designer','Front-end Developer','Webmaster'] },
  { code:'21230', title:'Computer Systems Manager / IT Manager', cat:'IT', teer:0, eligible:true, wage:'$90k–$160k', desc:'Plan, organize, and direct IT operations and computer systems.', subs:['IT Manager','IT Director','CTO','VP of Engineering','Systems Manager','Infrastructure Manager'] },
  { code:'21234', title:'Web Designer / Developer (Interactive Media)', cat:'IT', teer:1, eligible:true, wage:'$50k–$95k', desc:'Design and develop digital media content for websites and applications.', subs:['UX Designer','UI Designer','Interaction Designer','Product Designer','Digital Designer'] },
  { code:'22220', title:'Computer Network Technician', cat:'IT', teer:2, eligible:true, wage:'$45k–$75k', desc:'Establish, operate, maintain, and troubleshoot computer networks.', subs:['Network Technician','Network Administrator','IT Support Specialist','LAN Technician','Network Operations Technician'] },
  { code:'22221', title:'User Support Technician', cat:'IT', teer:2, eligible:true, wage:'$40k–$65k', desc:'Provide first-line technical support and troubleshooting for computer users.', subs:['Help Desk Technician','IT Support Analyst','Desktop Support','Technical Support Specialist','IT Help Desk'] },
  { code:'21223', title:'Database Analyst / Administrator', cat:'IT', teer:1, eligible:true, wage:'$65k–$115k', desc:'Design, implement, and administer database management systems.', subs:['DBA','Database Administrator','Database Developer','SQL Developer','Data Architect'] },
  { code:'21233', title:'Cloud Engineer / DevOps', cat:'IT', teer:1, eligible:true, wage:'$80k–$145k', desc:'Design, deploy, and manage cloud computing infrastructure and services.', subs:['Cloud Architect','AWS Engineer','Azure Engineer','DevOps Engineer','Site Reliability Engineer','Platform Engineer'] },
  { code:'21210', title:'Mathematician / Statistician / Actuary', cat:'IT', teer:1, eligible:true, wage:'$65k–$120k', desc:'Apply mathematical and statistical methods to solve problems in science, engineering, and business.', subs:['Actuary','Statistician','Data Modeller','Quantitative Analyst','Biostatistician'] },
  { code:'21221', title:'Business Systems Specialist', cat:'IT', teer:1, eligible:true, wage:'$65k–$110k', desc:'Evaluate business processes and design IT solutions to improve efficiency.', subs:['Business Systems Analyst','SAP Consultant','CRM Specialist','Salesforce Developer','ERP Consultant'] },

  // ===== ENGINEERING =====
  { code:'21300', title:'Civil Engineer', cat:'Engineering', teer:1, eligible:true, wage:'$65k–$110k', desc:'Plan, design, and oversee construction of infrastructure projects.', subs:['Structural Engineer','Transportation Engineer','Geotechnical Engineer','Municipal Engineer','Environmental Engineer'] },
  { code:'21310', title:'Electrical / Electronics Engineer', cat:'Engineering', teer:1, eligible:true, wage:'$65k–$115k', desc:'Design, develop, and test electrical and electronic systems.', subs:['Electrical Engineer','Electronics Engineer','Power Systems Engineer','Control Systems Engineer','Telecommunications Engineer'] },
  { code:'21321', title:'Mechanical Engineer', cat:'Engineering', teer:1, eligible:true, wage:'$65k–$110k', desc:'Design, develop, and test mechanical devices, systems, and processes.', subs:['Mechanical Engineer','HVAC Engineer','Automotive Engineer','Manufacturing Engineer','Robotics Engineer'] },
  { code:'21330', title:'Chemical Engineer', cat:'Engineering', teer:1, eligible:true, wage:'$70k–$120k', desc:'Design and develop chemical processes and equipment for manufacturing.', subs:['Chemical Engineer','Process Engineer','Petrochemical Engineer','Biochemical Engineer'] },
  { code:'22300', title:'Engineering Technologist / Technician', cat:'Engineering', teer:2, eligible:true, wage:'$45k–$75k', desc:'Provide technical support in civil, mechanical, electrical, or chemical engineering.', subs:['Civil Engineering Tech','Mechanical Engineering Tech','Electrical Technologist','Engineering Aide','CAD Technician'] },
  { code:'21390', title:'Aerospace Engineer', cat:'Engineering', teer:1, eligible:true, wage:'$70k–$130k', desc:'Design, develop, and test aircraft, spacecraft, and related systems.', subs:['Aerospace Engineer','Aeronautical Engineer','Avionics Engineer','Flight Systems Engineer'] },
  { code:'21301', title:'Environmental Engineer', cat:'Engineering', teer:1, eligible:true, wage:'$60k–$105k', desc:'Assess environmental impact and design solutions for pollution control.', subs:['Environmental Engineer','Sustainability Engineer','Water Resources Engineer','Remediation Engineer'] },
  { code:'21311', title:'Computer Engineer', cat:'Engineering', teer:1, eligible:true, wage:'$70k–$130k', desc:'Design and develop computer hardware and embedded systems.', subs:['Computer Hardware Engineer','Embedded Systems Engineer','FPGA Engineer','Firmware Engineer'] },
  { code:'20010', title:'Engineering Manager', cat:'Engineering', teer:0, eligible:true, wage:'$100k–$160k', desc:'Plan, organize, and direct engineering departments and projects.', subs:['Engineering Manager','VP Engineering','Director of Engineering','Technical Program Manager'] },

  // ===== TRADES & SKILLED LABOUR =====
  { code:'72010', title:'Electrician', cat:'Trades', teer:2, eligible:true, wage:'$50k–$85k', desc:'Install, maintain, and repair electrical wiring, equipment, and fixtures.', subs:['Construction Electrician','Industrial Electrician','Residential Electrician','Commercial Electrician','Maintenance Electrician'] },
  { code:'72011', title:'Industrial Electrician', cat:'Trades', teer:2, eligible:true, wage:'$55k–$90k', desc:'Install, maintain, and repair industrial electrical systems and equipment.', subs:['Industrial Electrician','Plant Electrician','Mill Electrician','Factory Electrician'] },
  { code:'72020', title:'Plumber', cat:'Trades', teer:2, eligible:true, wage:'$50k–$85k', desc:'Install, repair, and maintain pipes, fixtures, and plumbing systems.', subs:['Plumber','Pipefitter','Steamfitter','Sprinkler System Installer','Plumbing Contractor'] },
  { code:'72106', title:'Welder', cat:'Trades', teer:2, eligible:true, wage:'$42k–$75k', desc:'Join metals using various welding processes in manufacturing, construction, and repair.', subs:['Welder','MIG Welder','TIG Welder','Stick Welder','Pipe Welder','Structural Welder','Underwater Welder'] },
  { code:'72200', title:'Carpenter', cat:'Trades', teer:2, eligible:true, wage:'$42k–$72k', desc:'Construct, install, and repair structures and fixtures made of wood and other materials.', subs:['Framing Carpenter','Finish Carpenter','Cabinetmaker','Formwork Carpenter','Renovation Carpenter'] },
  { code:'72014', title:'HVAC Technician / Mechanic', cat:'Trades', teer:2, eligible:true, wage:'$48k–$80k', desc:'Install, maintain, and repair heating, ventilation, and air conditioning systems.', subs:['HVAC Technician','Refrigeration Mechanic','HVAC Installer','AC Technician','Heating Technician'] },
  { code:'72102', title:'Sheet Metal Worker', cat:'Trades', teer:2, eligible:true, wage:'$45k–$78k', desc:'Fabricate, install, and repair sheet metal products and systems.', subs:['Sheet Metal Worker','Tinsmith','HVAC Sheet Metal Worker','Architectural Sheet Metal Worker'] },
  { code:'72310', title:'Automotive Service Technician / Mechanic', cat:'Trades', teer:2, eligible:true, wage:'$38k–$68k', desc:'Inspect, diagnose, repair, and service motor vehicles.', subs:['Auto Mechanic','Automotive Technician','Diesel Mechanic','Brake Technician','Transmission Specialist','Alignment Technician'] },
  { code:'72320', title:'Heavy-Duty Equipment Mechanic', cat:'Trades', teer:2, eligible:true, wage:'$55k–$95k', desc:'Repair, troubleshoot, and maintain heavy equipment used in construction and mining.', subs:['Heavy Equipment Mechanic','Heavy Duty Technician','Equipment Maintenance Mechanic','Diesel Fitter'] },
  { code:'72400', title:'Heavy Equipment Operator', cat:'Trades', teer:2, eligible:true, wage:'$50k–$90k', desc:'Operate heavy equipment for construction, mining, and road building.', subs:['Excavator Operator','Bulldozer Operator','Crane Operator','Backhoe Operator','Grader Operator','Loader Operator'] },
  { code:'72401', title:'Crane Operator', cat:'Trades', teer:2, eligible:true, wage:'$55k–$95k', desc:'Operate cranes to lift, move, and place heavy objects at construction sites.', subs:['Tower Crane Operator','Mobile Crane Operator','Boom Truck Operator','Overhead Crane Operator'] },
  { code:'72100', title:'Machinist', cat:'Trades', teer:2, eligible:true, wage:'$42k–$70k', desc:'Set up and operate machine tools to cut or grind metal parts.', subs:['CNC Machinist','CNC Operator','Tool and Die Maker','Mould Maker','Lathe Operator','Mill Operator'] },
  { code:'72110', title:'Glazier', cat:'Trades', teer:2, eligible:true, wage:'$42k–$70k', desc:'Cut, fit, install, and replace glass in residential, commercial, and industrial buildings.', subs:['Glazier','Glass Installer','Window Installer','Curtain Wall Installer','Auto Glass Technician'] },
  { code:'72201', title:'Roofer', cat:'Trades', teer:2, eligible:true, wage:'$38k–$65k', desc:'Install, repair, and replace roofs using various roofing materials.', subs:['Roofer','Shingler','Flat Roofer','Commercial Roofer','Roofing Contractor'] },
  { code:'72013', title:'Gas Fitter', cat:'Trades', teer:2, eligible:true, wage:'$50k–$82k', desc:'Install, repair, and maintain gas lines, equipment, and appliances.', subs:['Gas Fitter','Gas Technician','Natural Gas Installer'] },
  { code:'73100', title:'Concrete Finisher', cat:'Trades', teer:3, eligible:true, wage:'$38k–$62k', desc:'Smooth and finish freshly poured concrete and apply curing compounds.', subs:['Concrete Finisher','Cement Mason','Concrete Pump Operator'] },
  { code:'73102', title:'Painter / Decorator', cat:'Trades', teer:3, eligible:true, wage:'$35k–$58k', desc:'Apply paint, wallpaper, and other finishes to interior and exterior surfaces.', subs:['Painter','House Painter','Commercial Painter','Industrial Painter','Spray Painter','Decorator'] },
  { code:'72012', title:'Power Line Technician', cat:'Trades', teer:2, eligible:true, wage:'$60k–$100k', desc:'Construct and maintain overhead and underground electrical power lines.', subs:['Power Line Technician','Lineman','Powerline Worker','Cable Splicer'] },
  { code:'72021', title:'Millwright', cat:'Trades', teer:2, eligible:true, wage:'$55k–$88k', desc:'Install, maintain, and repair industrial machinery and mechanical equipment.', subs:['Industrial Millwright','Maintenance Millwright','Machine Fitter','Plant Millwright'] },

  // ===== TRANSPORT & LOGISTICS =====
  { code:'73300', title:'Transport Truck Driver', cat:'Transport', teer:3, eligible:true, wage:'$40k–$70k', desc:'Operate heavy trucks to transport goods over urban, interurban, and international routes.', subs:['Long-haul Truck Driver','Local Delivery Driver','Flatbed Driver','Tanker Driver','Reefer Driver','AZ Driver','DZ Driver'] },
  { code:'73301', title:'Bus Driver / Transit Operator', cat:'Transport', teer:3, eligible:true, wage:'$38k–$65k', desc:'Drive buses and transit vehicles to transport passengers on scheduled routes.', subs:['City Bus Driver','School Bus Driver','Transit Operator','Charter Bus Driver','Intercity Bus Driver'] },
  { code:'73310', title:'Delivery / Courier Driver', cat:'Transport', teer:3, eligible:true, wage:'$32k–$50k', desc:'Pick up and deliver packages, parcels, and documents.', subs:['Courier Driver','Delivery Driver','Parcel Delivery','Express Courier','Last-mile Delivery Driver'] },
  { code:'75101', title:'Warehouse Worker / Material Handler', cat:'Transport', teer:5, eligible:false, wage:'$30k–$42k', desc:'Handle, move, load, and unload materials by hand or using basic equipment.', subs:['Warehouse Worker','Material Handler','Order Picker','Packer','Shipping Clerk','Receiving Clerk','Forklift Operator'] },
  { code:'73200', title:'Forklift Operator / Industrial Truck Operator', cat:'Transport', teer:3, eligible:true, wage:'$35k–$52k', desc:'Operate industrial trucks and forklifts to move materials in warehouses and yards.', subs:['Forklift Operator','Reach Truck Operator','Warehouse Forklift Driver','Dock Worker'] },
  { code:'70020', title:'Transportation Manager / Logistics Manager', cat:'Transport', teer:0, eligible:true, wage:'$65k–$110k', desc:'Plan, organize, and direct transportation and logistics operations.', subs:['Logistics Manager','Fleet Manager','Supply Chain Manager','Distribution Manager','Dispatch Manager'] },
  { code:'12013', title:'Customs Broker / Supply Chain Coordinator', cat:'Transport', teer:2, eligible:true, wage:'$45k–$70k', desc:'Coordinate import/export logistics and customs clearance processes.', subs:['Customs Broker','Import/Export Coordinator','Freight Forwarder','Logistics Coordinator','Supply Chain Analyst'] },

  // ===== BUSINESS & FINANCE =====
  { code:'11100', title:'Accountant / Financial Auditor', cat:'Business', teer:1, eligible:true, wage:'$50k–$90k', desc:'Plan and administer accounting systems, examine financial records, and prepare tax returns.', subs:['Accountant','CPA','Auditor','Tax Accountant','Forensic Accountant','Payroll Accountant','Bookkeeper','Financial Controller'] },
  { code:'11101', title:'Financial Analyst / Investment Analyst', cat:'Business', teer:1, eligible:true, wage:'$55k–$100k', desc:'Analyze financial data and prepare reports for investment decisions.', subs:['Financial Analyst','Investment Analyst','Portfolio Manager','Equity Analyst','Credit Analyst','Risk Analyst'] },
  { code:'11200', title:'Human Resources Manager', cat:'Business', teer:0, eligible:true, wage:'$75k–$120k', desc:'Plan, organize, and direct HR operations, staffing, and training.', subs:['HR Manager','HR Director','Talent Acquisition Manager','Compensation Manager','HR Business Partner'] },
  { code:'11201', title:'HR Professional / Recruiter', cat:'Business', teer:1, eligible:true, wage:'$45k–$80k', desc:'Develop and implement HR policies, recruit staff, and manage employee relations.', subs:['HR Specialist','Recruiter','Talent Acquisition Specialist','HR Coordinator','Staffing Consultant','HR Generalist'] },
  { code:'11102', title:'Business Management Consultant', cat:'Business', teer:1, eligible:true, wage:'$60k–$120k', desc:'Analyze business practices and provide advice on management and strategy.', subs:['Management Consultant','Strategy Consultant','Operations Consultant','Business Advisor','Change Management Consultant'] },
  { code:'10010', title:'Financial Manager / Director', cat:'Business', teer:0, eligible:true, wage:'$90k–$160k', desc:'Plan, organize, and direct financial operations and policies of an organization.', subs:['CFO','Finance Director','Controller','VP Finance','Treasury Manager'] },
  { code:'12011', title:'Administrative Assistant / Office Admin', cat:'Business', teer:2, eligible:true, wage:'$35k–$55k', desc:'Provide administrative support and coordinate office procedures.', subs:['Admin Assistant','Office Administrator','Executive Assistant','Receptionist','Office Coordinator','Secretary'] },
  { code:'60010', title:'Sales / Marketing Manager', cat:'Business', teer:0, eligible:true, wage:'$65k–$130k', desc:'Plan, organize, and direct sales and marketing activities.', subs:['Sales Manager','Marketing Manager','Business Development Manager','Brand Manager','Digital Marketing Manager','Account Manager'] },
  { code:'11202', title:'Professional Occupation in Marketing / Advertising', cat:'Business', teer:1, eligible:true, wage:'$45k–$90k', desc:'Develop marketing strategies, advertising campaigns, and public relations.', subs:['Marketing Specialist','Digital Marketer','SEO Specialist','Social Media Manager','Content Marketing Manager','Brand Strategist','Advertising Manager'] },
  { code:'13100', title:'Insurance / Real Estate Agent', cat:'Business', teer:2, eligible:true, wage:'$40k–$90k', desc:'Sell insurance policies, real estate, or other financial products and services.', subs:['Insurance Agent','Real Estate Agent','Mortgage Broker','Insurance Broker','Property Manager'] },
  { code:'10020', title:'Senior Manager / CEO', cat:'Business', teer:0, eligible:true, wage:'$100k–$250k+', desc:'Determine and formulate policies and strategic direction of organizations.', subs:['CEO','President','COO','Vice President','Managing Director','General Manager'] },
  { code:'12010', title:'Project Manager / Coordinator', cat:'Business', teer:2, eligible:true, wage:'$55k–$95k', desc:'Coordinate resources, timelines, and deliverables for organizational projects.', subs:['Project Manager','PMP','Project Coordinator','Scrum Master','Agile Coach','Program Manager'] },

  // ===== EDUCATION =====
  { code:'41200', title:'University Professor / Lecturer', cat:'Education', teer:1, eligible:true, wage:'$70k–$150k', desc:'Teach courses, conduct research, and publish at universities and colleges.', subs:['University Professor','Associate Professor','Lecturer','Research Professor','Teaching Professor'] },
  { code:'41220', title:'Secondary School Teacher', cat:'Education', teer:1, eligible:true, wage:'$55k–$95k', desc:'Teach academic, technical, or vocational subjects at the secondary school level.', subs:['High School Teacher','Math Teacher','Science Teacher','English Teacher','French Teacher','History Teacher'] },
  { code:'41221', title:'Elementary School Teacher', cat:'Education', teer:1, eligible:true, wage:'$50k–$90k', desc:'Teach basic subjects at the elementary school level.', subs:['Elementary Teacher','Primary Teacher','Grade School Teacher','French Immersion Teacher'] },
  { code:'42202', title:'Early Childhood Educator (ECE)', cat:'Education', teer:2, eligible:true, wage:'$30k–$48k', desc:'Plan, organize, and implement programs for children aged 0-12 in childcare centres.', subs:['ECE','Preschool Teacher','Daycare Teacher','Childcare Worker','Montessori Teacher','Kindergarten Teacher'] },
  { code:'42203', title:'Educational Counsellor', cat:'Education', teer:2, eligible:true, wage:'$50k–$80k', desc:'Advise students on educational programs, career planning, and personal issues.', subs:['Guidance Counsellor','School Counsellor','Academic Advisor','Career Counsellor'] },
  { code:'41210', title:'College / Vocational Instructor', cat:'Education', teer:1, eligible:true, wage:'$55k–$100k', desc:'Teach applied arts, academic, or vocational subjects at colleges.', subs:['College Instructor','Vocational Trainer','Technical Instructor','CEGEP Teacher'] },
  { code:'41201', title:'ESL / Language Instructor', cat:'Education', teer:1, eligible:true, wage:'$40k–$65k', desc:'Teach English or French as a second language to newcomers and students.', subs:['ESL Teacher','LINC Instructor','French Teacher','Language Tutor','TESOL Instructor'] },

  // ===== FOOD & HOSPITALITY =====
  { code:'63200', title:'Cook', cat:'Hospitality', teer:3, eligible:true, wage:'$30k–$45k', desc:'Prepare and cook meals in restaurants, hotels, hospitals, and food service establishments.', subs:['Line Cook','Prep Cook','Short Order Cook','Hospital Cook','Hotel Cook','Institutional Cook'] },
  { code:'62200', title:'Chef', cat:'Hospitality', teer:2, eligible:true, wage:'$40k–$70k', desc:'Plan menus, direct food preparation, and manage kitchen operations.', subs:['Head Chef','Sous Chef','Executive Chef','Pastry Chef','Sushi Chef','Chef de Cuisine'] },
  { code:'60030', title:'Restaurant / Food Service Manager', cat:'Hospitality', teer:0, eligible:true, wage:'$45k–$75k', desc:'Plan, organize, and direct restaurant and food service operations.', subs:['Restaurant Manager','Food Service Manager','Catering Manager','Kitchen Manager','Bar Manager'] },
  { code:'62201', title:'Butcher / Baker', cat:'Hospitality', teer:2, eligible:true, wage:'$32k–$52k', desc:'Cut, trim, and prepare meat or bake bread and pastries for sale.', subs:['Butcher','Meat Cutter','Baker','Pastry Baker','Industrial Butcher'] },
  { code:'65200', title:'Food & Beverage Server', cat:'Hospitality', teer:4, eligible:false, wage:'$28k–$38k+tips', desc:'Take orders, serve food and beverages to patrons in restaurants and bars.', subs:['Waiter','Waitress','Server','Bartender','Barista','Host/Hostess'] },
  { code:'64300', title:'Hotel Front Desk Clerk', cat:'Hospitality', teer:4, eligible:false, wage:'$30k–$42k', desc:'Register arriving guests, assign rooms, and settle accounts at checkout.', subs:['Front Desk Agent','Hotel Receptionist','Night Auditor','Guest Service Agent','Concierge'] },
  { code:'60031', title:'Hotel / Accommodation Manager', cat:'Hospitality', teer:0, eligible:true, wage:'$50k–$90k', desc:'Plan, organize, and direct hotel operations and guest services.', subs:['Hotel Manager','General Manager','Hospitality Manager','Resort Manager','Lodging Manager'] },

  // ===== CONSTRUCTION =====
  { code:'70010', title:'Construction Manager', cat:'Construction', teer:0, eligible:true, wage:'$70k–$130k', desc:'Plan, organize, direct, and control construction project activities.', subs:['Construction Manager','Site Superintendent','Project Manager','Construction Superintendent','General Contractor'] },
  { code:'72210', title:'Ironworker', cat:'Construction', teer:2, eligible:true, wage:'$50k–$85k', desc:'Fabricate, erect, and install structural steel and iron components.', subs:['Structural Ironworker','Reinforcing Ironworker','Ornamental Ironworker','Steel Erector'] },
  { code:'72301', title:'Tilemaker / Floor Installer', cat:'Construction', teer:2, eligible:true, wage:'$38k–$60k', desc:'Install ceramic, marble, and other tiles and floor coverings.', subs:['Tile Setter','Floor Installer','Carpet Layer','Flooring Installer','Tile Mechanic'] },
  { code:'73101', title:'Insulator', cat:'Construction', teer:3, eligible:true, wage:'$42k–$68k', desc:'Apply insulation materials to pipes, ducts, and equipment.', subs:['Insulator','Heat and Frost Insulator','Mechanical Insulator','Building Insulator'] },
  { code:'73110', title:'Drywall Installer / Finisher', cat:'Construction', teer:3, eligible:true, wage:'$35k–$58k', desc:'Install and finish drywall sheets for walls and ceilings.', subs:['Drywaller','Drywall Taper','Drywall Finisher','Plasterer'] },
  { code:'73200', title:'General Construction Labourer', cat:'Construction', teer:3, eligible:true, wage:'$32k–$52k', desc:'Perform general construction work and assist skilled tradespeople.', subs:['Construction Labourer','General Labourer','Construction Helper','Demolition Worker'] },
  { code:'22303', title:'Construction Estimator / Inspector', cat:'Construction', teer:2, eligible:true, wage:'$50k–$85k', desc:'Prepare cost estimates and inspect construction work for compliance.', subs:['Construction Estimator','Building Inspector','Quantity Surveyor','Cost Estimator'] },
  { code:'22301', title:'Land Surveyor / Geomatics Technician', cat:'Construction', teer:2, eligible:true, wage:'$48k–$78k', desc:'Conduct surveys to determine property boundaries and prepare maps.', subs:['Land Surveyor','Geomatics Technician','Survey Technician','GIS Analyst','Cartographer'] },

  // ===== RETAIL & SALES =====
  { code:'62020', title:'Retail Store Manager', cat:'Retail', teer:2, eligible:true, wage:'$40k–$65k', desc:'Plan, direct, and control daily operations of retail establishments.', subs:['Store Manager','Assistant Manager','Department Manager','Branch Manager','Shop Manager'] },
  { code:'64100', title:'Retail Salesperson / Sales Associate', cat:'Retail', teer:4, eligible:false, wage:'$28k–$40k', desc:'Assist customers, demonstrate products, and process sales transactions.', subs:['Sales Associate','Sales Clerk','Cashier','Customer Service Representative','Retail Associate'] },
  { code:'62100', title:'Technical Sales Specialist', cat:'Retail', teer:2, eligible:true, wage:'$50k–$100k', desc:'Sell technical products and services requiring specialized knowledge.', subs:['Technical Sales Rep','Account Executive','Sales Engineer','B2B Sales Representative','Territory Sales Manager'] },
  { code:'64101', title:'Customer Service Representative', cat:'Retail', teer:4, eligible:false, wage:'$30k–$45k', desc:'Handle customer inquiries, complaints, and provide product information.', subs:['Customer Service Rep','Call Centre Agent','Client Service Associate','Support Representative'] },

  // ===== ARTS, MEDIA & DESIGN =====
  { code:'21233', title:'Graphic Designer / Illustrator', cat:'Creative', teer:1, eligible:true, wage:'$40k–$70k', desc:'Design visual communications, layouts, and illustrations for various media.', subs:['Graphic Designer','Visual Designer','Brand Designer','Illustrator','Layout Designer','Print Designer'] },
  { code:'51111', title:'Video / Film Editor', cat:'Creative', teer:1, eligible:true, wage:'$40k–$80k', desc:'Edit moving images and sound recordings for film, TV, and digital media.', subs:['Video Editor','Film Editor','Post-Production Editor','Motion Graphics Artist','VFX Artist'] },
  { code:'51120', title:'Photographer', cat:'Creative', teer:1, eligible:true, wage:'$30k–$65k', desc:'Photograph persons, events, scenes, and subjects using digital or film equipment.', subs:['Commercial Photographer','Portrait Photographer','Wedding Photographer','Product Photographer'] },
  { code:'52100', title:'Interior Designer', cat:'Creative', teer:2, eligible:true, wage:'$40k–$75k', desc:'Plan and design interior spaces for functionality, safety, and aesthetics.', subs:['Interior Designer','Interior Decorator','Space Planner','Residential Designer','Commercial Designer'] },
  { code:'51100', title:'Writer / Author / Editor', cat:'Creative', teer:1, eligible:true, wage:'$40k–$80k', desc:'Write and edit content for publications, websites, and other media.', subs:['Content Writer','Copywriter','Technical Writer','Editor','Journalist','Blogger','Scriptwriter'] },
  { code:'51113', title:'Musician / Singer', cat:'Creative', teer:1, eligible:true, wage:'$25k–$70k', desc:'Perform music as instrumentalists or vocalists in live and recorded settings.', subs:['Musician','Singer','Composer','Music Director','Band Member','Orchestra Musician'] },

  // ===== SOCIAL & COMMUNITY SERVICES =====
  { code:'41300', title:'Social Worker', cat:'Community', teer:1, eligible:true, wage:'$50k–$80k', desc:'Help individuals, families, and communities cope with social and personal problems.', subs:['Clinical Social Worker','Child Welfare Worker','Medical Social Worker','Mental Health Social Worker','Family Counsellor'] },
  { code:'41301', title:'Psychologist', cat:'Community', teer:1, eligible:true, wage:'$70k–$120k', desc:'Assess and treat behavioral, emotional, and cognitive disorders.', subs:['Clinical Psychologist','Counselling Psychologist','School Psychologist','Industrial Psychologist'] },
  { code:'41320', title:'Immigration Consultant / Paralegal', cat:'Community', teer:1, eligible:true, wage:'$40k–$75k', desc:'Provide immigration advice, prepare applications, and represent clients.', subs:['Immigration Consultant','RCIC','Paralegal','Immigration Advisor','Visa Consultant'] },
  { code:'42201', title:'Community / Social Service Worker', cat:'Community', teer:2, eligible:true, wage:'$35k–$55k', desc:'Administer community programs and assist individuals with social needs.', subs:['Community Worker','Settlement Worker','Youth Worker','Outreach Worker','Case Manager','Integration Worker'] },
  { code:'43100', title:'Police Officer', cat:'Community', teer:2, eligible:true, wage:'$60k–$100k', desc:'Maintain law and order, detect and prevent crime, and protect the public.', subs:['Police Officer','Constable','Detective','RCMP Officer','Municipal Police'] },
  { code:'43200', title:'Firefighter', cat:'Community', teer:2, eligible:true, wage:'$60k–$100k', desc:'Respond to fire alarms, rescue victims, and operate firefighting equipment.', subs:['Firefighter','Fire Captain','Fire Inspector','Forest Firefighter'] },
  { code:'41310', title:'Policy Analyst / Researcher', cat:'Community', teer:1, eligible:true, wage:'$55k–$90k', desc:'Research and analyze public policy issues and recommend solutions.', subs:['Policy Analyst','Research Officer','Government Analyst','Public Policy Advisor','Program Analyst'] },

  // ===== AGRICULTURE & NATURAL RESOURCES =====
  { code:'80020', title:'Farm Manager', cat:'Agriculture', teer:0, eligible:true, wage:'$45k–$80k', desc:'Plan, organize, and control farm operations and manage farm workers.', subs:['Farm Manager','Ranch Manager','Greenhouse Manager','Dairy Farm Manager','Agriculture Manager'] },
  { code:'82030', title:'Agricultural Technician', cat:'Agriculture', teer:2, eligible:true, wage:'$35k–$55k', desc:'Provide technical support for crop and livestock production.', subs:['Agricultural Technician','Crop Scout','Farm Technician','Livestock Technician'] },
  { code:'85100', title:'Farm Worker / Harvester', cat:'Agriculture', teer:5, eligible:false, wage:'$28k–$38k', desc:'Plant, cultivate, and harvest crops and raise livestock.', subs:['Farm Worker','Harvester','Fruit Picker','Greenhouse Worker','Dairy Farm Worker'] },
  { code:'82021', title:'Landscaper / Groundskeeper', cat:'Agriculture', teer:2, eligible:true, wage:'$32k–$52k', desc:'Maintain lawns, gardens, and grounds of residential and commercial properties.', subs:['Landscaper','Groundskeeper','Horticulturist','Arborist','Lawn Care Specialist','Garden Designer'] },
  { code:'21102', title:'Biologist / Marine Biologist', cat:'Agriculture', teer:1, eligible:true, wage:'$50k–$85k', desc:'Conduct research on living organisms and biological processes.', subs:['Biologist','Marine Biologist','Wildlife Biologist','Ecologist','Microbiologist','Botanist'] },

  // ===== LEGAL =====
  { code:'41100', title:'Lawyer / Notary', cat:'Legal', teer:1, eligible:true, wage:'$70k–$200k+', desc:'Advise clients on legal matters, represent in court, and draft legal documents.', subs:['Lawyer','Attorney','Barrister','Solicitor','Notary Public','Corporate Lawyer','Criminal Lawyer','Immigration Lawyer'] },
  { code:'42100', title:'Legal Assistant / Paralegal Professional', cat:'Legal', teer:2, eligible:true, wage:'$38k–$60k', desc:'Assist lawyers by conducting research, drafting documents, and managing case files.', subs:['Paralegal','Legal Assistant','Law Clerk','Legal Secretary','Legal Researcher'] },

  // ===== CLEANING & MAINTENANCE =====
  { code:'65310', title:'Light Duty Cleaner / Janitor', cat:'Maintenance', teer:5, eligible:false, wage:'$28k–$38k', desc:'Clean and maintain lobbies, hallways, offices, and rooms.', subs:['Janitor','Cleaner','Custodian','Housekeeper','Office Cleaner','Building Cleaner'] },
  { code:'65311', title:'Specialized Cleaner', cat:'Maintenance', teer:5, eligible:false, wage:'$30k–$42k', desc:'Perform specialized cleaning using equipment and techniques.', subs:['Industrial Cleaner','Window Cleaner','Carpet Cleaner','Crime Scene Cleaner'] },
  { code:'73201', title:'Building Maintenance Worker', cat:'Maintenance', teer:3, eligible:true, wage:'$35k–$55k', desc:'Perform general maintenance and minor repairs in buildings.', subs:['Maintenance Worker','Building Superintendent','Handyman','Facilities Maintenance','Building Caretaker'] },

  // ===== BEAUTY & PERSONAL SERVICES =====
  { code:'63210', title:'Hairstylist / Barber', cat:'Services', teer:3, eligible:true, wage:'$28k–$50k', desc:'Cut, style, colour, and treat hair; provide hair care services.', subs:['Hairstylist','Barber','Hair Colourist','Salon Stylist','Hair Designer'] },
  { code:'63211', title:'Esthetician', cat:'Services', teer:3, eligible:true, wage:'$28k–$48k', desc:'Provide facial and body skin care treatments and beauty services.', subs:['Esthetician','Skin Care Specialist','Makeup Artist','Nail Technician','Spa Therapist','Beauty Therapist'] },

  // ===== NATURAL SCIENCES =====
  { code:'21100', title:'Chemist / Chemical Technologist', cat:'Engineering', teer:1, eligible:true, wage:'$50k–$85k', desc:'Conduct chemical analyses and experiments in research, quality control, and manufacturing.', subs:['Chemist','Chemical Technologist','Lab Chemist','Quality Control Chemist','Analytical Chemist'] },
  { code:'21110', title:'Geologist / Geoscientist', cat:'Engineering', teer:1, eligible:true, wage:'$55k–$110k', desc:'Study the composition, structure, and processes of the earth.', subs:['Geologist','Geophysicist','Hydrogeologist','Mining Geologist','Environmental Geologist'] },
  { code:'21120', title:'Urban / Land Use Planner', cat:'Engineering', teer:1, eligible:true, wage:'$55k–$90k', desc:'Develop plans and policies for land use in urban and rural areas.', subs:['Urban Planner','City Planner','Land Use Planner','Regional Planner','Transportation Planner'] },
];

const nocSearchInput = document.getElementById('nocSearch');
const nocResultsDiv = document.getElementById('nocResults');

function searchNOC(query) {
  if (nocSearchInput) nocSearchInput.value = query;
  performNOCSearch(query);
}

function nocBrowseCategory(cat) {
  nocSearchInput.value = '';
  document.querySelectorAll('.noc-cat-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.noc-cat-btn[data-cat="' + cat + '"]');
  if (btn) btn.classList.add('active');
  const results = cat === 'all' ? nocDatabase : nocDatabase.filter(n => n.cat === cat);
  renderNOCResults(results, cat === 'all' ? '' : cat);
}

function performNOCSearch(query) {
  document.querySelectorAll('.noc-cat-btn').forEach(b => b.classList.remove('active'));
  if (!nocResultsDiv) return;
  if (!query || query.length < 2) { nocResultsDiv.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const results = nocDatabase.filter(noc =>
    noc.title.toLowerCase().includes(q) ||
    noc.code.includes(q) ||
    noc.desc.toLowerCase().includes(q) ||
    noc.subs.some(s => s.toLowerCase().includes(q))
  );
  renderNOCResults(results, '');
}

function renderNOCResults(results, category) {
  if (results.length === 0) {
    nocResultsDiv.innerHTML = '<div class="noc-empty"><p>No matching NOC codes found.</p><p>Try a different keyword, job title, or NOC code number.</p></div>';
    return;
  }

  const countText = '<div class="noc-results-count">' +
    '<span class="noc-count-number">' + results.length + '</span> occupation' + (results.length !== 1 ? 's' : '') + ' found' +
    (category ? ' in <strong>' + category + '</strong>' : '') +
    '<span class="noc-count-stat">' + results.filter(n => n.eligible).length + ' eligible for Express Entry</span>' +
  '</div>';

  nocResultsDiv.innerHTML = countText + results.map(noc => {
    const eligibleClass = noc.eligible ? 'eligible' : 'not-eligible';
    const eligibleIcon = noc.eligible
      ? '<span class="noc-elig-yes">Express Entry Eligible</span>'
      : '<span class="noc-elig-no">Not Express Entry Eligible (TEER ' + noc.teer + ')</span>';
    const teerClass = noc.teer <= 1 ? 'teer-high' : noc.teer <= 3 ? 'teer-mid' : 'teer-low';
    const subsHTML = noc.subs.map(s =>
      '<a href="https://ca.indeed.com/jobs?q=' + encodeURIComponent(s) + '&l=Canada" target="_blank" rel="noopener" class="noc-sub-tag" title="Search \'' + s + '\' jobs on Indeed">' + s + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>'
    ).join('');
    const wageHTML = noc.wage ? '<span class="noc-wage-badge">' + noc.wage + '/yr</span>' : '';
    const jobBankURL = 'https://www.jobbank.gc.ca/marketreport/summary-occupation/' + noc.code + '/ca';
    const indeedURL = 'https://ca.indeed.com/jobs?q=' + encodeURIComponent(noc.title.split('/')[0].split('(')[0].trim());

    return '<div class="noc-result-card ' + eligibleClass + '">' +
      '<div class="noc-card-header">' +
        '<div class="noc-card-title-row">' +
          '<h4>' + noc.title + '</h4>' +
          '<div class="noc-badges">' +
            '<span class="noc-code-badge">NOC ' + noc.code + '</span>' +
            '<span class="noc-teer-badge ' + teerClass + '">TEER ' + noc.teer + '</span>' +
            wageHTML +
          '</div>' +
        '</div>' +
        '<div class="noc-elig-row">' + eligibleIcon + '<span class="noc-cat-badge">' + noc.cat + '</span></div>' +
      '</div>' +
      '<p class="noc-card-desc">' + noc.desc + '</p>' +
      '<div class="noc-subs-section">' +
        '<span class="noc-subs-label">Click a job title to search jobs on Indeed:</span>' +
        '<div class="noc-subs-list">' + subsHTML + '</div>' +
      '</div>' +
      '<div class="noc-card-actions">' +
        '<a href="' + jobBankURL + '" target="_blank" rel="noopener" class="noc-action-btn noc-btn-jobbank"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg> Job Bank Canada</a>' +
        '<a href="' + indeedURL + '" target="_blank" rel="noopener" class="noc-action-btn noc-btn-indeed"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Search on Indeed</a>' +
        '<a href="https://noc.esdc.gc.ca/Structure/NocProfile?objectId=' + noc.code + '" target="_blank" rel="noopener" class="noc-action-btn noc-btn-official"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Official NOC Profile</a>' +
      '</div>' +
    '</div>';
  }).join('');
}

if (nocSearchInput) nocSearchInput.addEventListener('input', (e) => performNOCSearch(e.target.value));


// =============================================
// PROCESSING TIME FILTERS
// =============================================
document.querySelectorAll('.proc-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.proc-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    document.querySelectorAll('.proc-card').forEach(card => {
      if (filter === 'all') {
        card.classList.remove('hidden-proc');
      } else {
        card.classList.toggle('hidden-proc', card.getAttribute('data-cat') !== filter);
      }
    });
  });
});


// =============================================
// ASSESSMENT FORM → WHATSAPP
// =============================================
const assessmentForm = document.getElementById('assessmentForm');
if (assessmentForm) assessmentForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('fullName').value;
  const whatsapp = document.getElementById('whatsapp').value;
  const email = document.getElementById('assessEmail').value;
  const age = document.getElementById('assessAge').value;
  const education = document.getElementById('education').value;
  const status = document.getElementById('immigrationStatus').value;
  const goal = document.getElementById('goal').value;
  const ielts = document.getElementById('ieltsScore').value;

  const message = encodeURIComponent(
    `Hi, I'd like a free immigration assessment.\n\n` +
    `Name: ${name}\n` +
    `WhatsApp: ${whatsapp}\n` +
    `Email: ${email}\n` +
    `Age: ${age || 'N/A'}\n` +
    `Education: ${education || 'N/A'}\n` +
    `Status: ${status || 'N/A'}\n` +
    `Goal: ${goal || 'N/A'}\n` +
    `IELTS: ${ielts || 'N/A'}`
  );

  window.open(`https://wa.me/14374272470?text=${message}`, '_blank');
});


// =============================================
// COST ESTIMATOR
// =============================================
const costData = {
  'express-entry': {
    name: 'Express Entry (FSW / CEC / FSTP)',
    single: [
      ['Processing Fee', 850],
      ['Right of PR Fee (RPRF)', 515],
      ['Biometrics', 85],
      ['Medical Exam (approx.)', 300],
      ['Language Test (IELTS/CELPIP)', 350],
      ['ECA (Credential Assessment)', 250],
      ['Police Clearance', 50],
    ],
    spouseAdd: [
      ['Spouse Processing Fee', 850],
      ['Spouse RPRF', 515],
      ['Spouse Biometrics', 85],
      ['Spouse Medical Exam', 300],
      ['Spouse Language Test', 350],
    ],
    childAdd: [
      ['Per Dependent Child (processing)', 230],
      ['Per Child Medical Exam', 200],
    ]
  },
  'pnp': {
    name: 'Provincial Nominee Program (PNP)',
    single: [
      ['PNP Application Fee (varies by province)', 300],
      ['Federal Processing Fee', 850],
      ['Right of PR Fee (RPRF)', 515],
      ['Biometrics', 85],
      ['Medical Exam', 300],
      ['Language Test', 350],
      ['ECA', 250],
    ],
    spouseAdd: [
      ['Spouse Processing Fee', 850],
      ['Spouse RPRF', 515],
      ['Spouse Biometrics', 85],
      ['Spouse Medical Exam', 300],
    ],
    childAdd: [
      ['Per Dependent Child', 230],
      ['Per Child Medical', 200],
    ]
  },
  'aip': {
    name: 'Atlantic Immigration Program',
    single: [
      ['Endorsement Application', 0],
      ['Federal Processing Fee', 850],
      ['Right of PR Fee (RPRF)', 515],
      ['Biometrics', 85],
      ['Medical Exam', 300],
      ['Language Test', 350],
      ['ECA', 250],
    ],
    spouseAdd: [
      ['Spouse Processing Fee', 850],
      ['Spouse RPRF', 515],
      ['Spouse Biometrics', 85],
      ['Spouse Medical Exam', 300],
    ],
    childAdd: [
      ['Per Dependent Child', 230],
      ['Per Child Medical', 200],
    ]
  },
  'family-spouse': {
    name: 'Family Sponsorship (Spouse)',
    single: [
      ['Sponsorship Fee', 75],
      ['Principal Applicant Processing', 490],
      ['Right of PR Fee (RPRF)', 515],
      ['Biometrics', 85],
      ['Medical Exam', 300],
    ],
    spouseAdd: [],
    childAdd: [
      ['Per Dependent Child', 155],
      ['Per Child Medical', 200],
    ]
  },
  'work-permit': {
    name: 'Employer-Specific Work Permit',
    single: [
      ['Work Permit Processing Fee', 155],
      ['Biometrics', 85],
      ['Medical Exam (if required)', 300],
      ['Employer LMIA Fee (paid by employer)', 1000],
    ],
    spouseAdd: [
      ['Spouse Open Work Permit', 255],
      ['Spouse Biometrics', 85],
    ],
    childAdd: [
      ['Per Dependent Child Study Permit', 150],
    ]
  },
  'study-permit': {
    name: 'Study Permit',
    single: [
      ['Study Permit Processing', 150],
      ['Biometrics', 85],
      ['Medical Exam', 300],
      ['GIC (Guaranteed Investment)', 20635],
    ],
    spouseAdd: [
      ['Spouse Open Work Permit', 255],
      ['Spouse Biometrics', 85],
    ],
    childAdd: [
      ['Per Dependent Child', 150],
    ]
  },
  'visitor': {
    name: 'Visitor Visa (TRV)',
    single: [
      ['TRV Processing Fee', 100],
      ['Biometrics', 85],
    ],
    spouseAdd: [
      ['Spouse TRV Fee', 100],
      ['Spouse Biometrics', 85],
    ],
    childAdd: [
      ['Per Child TRV Fee', 100],
    ]
  },
  'super-visa': {
    name: 'Super Visa',
    single: [
      ['Super Visa Processing Fee', 100],
      ['Biometrics', 85],
      ['Medical Exam', 300],
      ['Medical Insurance (1 year, approx.)', 1500],
    ],
    spouseAdd: [
      ['Spouse Super Visa Fee', 100],
      ['Spouse Biometrics', 85],
      ['Spouse Medical Exam', 300],
      ['Spouse Insurance', 1500],
    ],
    childAdd: []
  },
  'tr-to-pr': {
    name: 'TR to PR 2026',
    single: [
      ['Processing Fee (estimated)', 850],
      ['Right of PR Fee (RPRF)', 515],
      ['Biometrics', 85],
      ['Medical Exam', 300],
    ],
    spouseAdd: [
      ['Spouse Processing Fee', 850],
      ['Spouse RPRF', 515],
      ['Spouse Biometrics', 85],
      ['Spouse Medical Exam', 300],
    ],
    childAdd: [
      ['Per Dependent Child', 230],
      ['Per Child Medical', 200],
    ]
  },
};

function updateCostEstimate() {
  const pathway = document.getElementById('costPathway').value;
  const applicant = document.getElementById('costApplicant').value;
  const resultDiv = document.getElementById('costResult');

  if (!pathway) { resultDiv.innerHTML = ''; return; }

  const data = costData[pathway];
  let items = [...data.single];
  if (applicant === 'couple' || applicant === 'family') {
    items = items.concat(data.spouseAdd);
  }
  if (applicant === 'family') {
    items = items.concat(data.childAdd);
  }

  let total = items.reduce((sum, item) => sum + item[1], 0);

  let rows = items.map(([name, cost]) =>
    `<tr><td>${name}</td><td>$${cost.toLocaleString()}</td></tr>`
  ).join('');

  resultDiv.innerHTML = `
    <table class="cost-table">
      <thead><tr><th>Fee Item</th><th>Amount (CAD)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cost-total">
      <span>Estimated Total</span>
      <span>$${total.toLocaleString()} CAD</span>
    </div>
    <p class="cost-note">* Fees are approximate and subject to change. Consult IRCC for current rates. Does not include consulting fees.</p>
  `;
}


// =============================================
// FAQ ACCORDION
// =============================================
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const wasOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

  // Toggle clicked
  if (!wasOpen) item.classList.add('open');
}


// =============================================
// WHATSAPP BUTTON — SHOW AFTER SCROLL
// =============================================
const whatsappBtn = document.getElementById('whatsappFloat');
if (whatsappBtn) {
  whatsappBtn.style.opacity = '0';
  whatsappBtn.style.pointerEvents = 'none';

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      whatsappBtn.style.opacity = '1';
      whatsappBtn.style.pointerEvents = 'auto';
    } else {
      whatsappBtn.style.opacity = '0';
      whatsappBtn.style.pointerEvents = 'none';
    }
  });
}

// ===== Auto-updating Immigration News from IRCC Feeds =====
(function loadIRCCNews() {
  const grid = document.getElementById('newsGrid');
  const loading = document.getElementById('newsLoading');
  const sourceNote = document.getElementById('newsSourceNote');
  if (!grid) return;

  const CACHE_KEY = 'tsh_ircc_news';
  const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  }

  function renderNews(articles) {
    if (!articles || articles.length === 0) {
      grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;opacity:0.7;">No recent news available. Check back soon.</p>';
      return;
    }
    grid.innerHTML = articles.map((item, i) => `
      <article class="news-card${i === 0 ? ' featured-news' : ''}">
        <div class="news-tag${i === 0 ? ' urgent' : ''}">${item.tag || 'Policy'}</div>
        <h3>${item.link ? '<a href="' + item.link + '" target="_blank" rel="noopener noreferrer">' + item.title + '</a>' : item.title}</h3>
        <p>${item.summary}</p>
        <div class="news-meta">
          <span>&#128197; ${formatDate(item.date)}</span>
          <span class="news-source-badge">${item.source || 'IRCC'}</span>
        </div>
      </article>
    `).join('');
    if (sourceNote) sourceNote.style.display = 'block';
  }

  // Check cache first
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      renderNews(cached.news);
      if (loading) loading.style.display = 'none';
      return;
    }
  } catch {}

  // Fetch from Netlify function
  fetch('/.netlify/functions/fetch-news')
    .then(res => res.json())
    .then(data => {
      if (loading) loading.style.display = 'none';
      if (data.news && data.news.length > 0) {
        renderNews(data.news);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ news: data.news, timestamp: Date.now() }));
        } catch {}
      } else {
        renderFallback();
      }
    })
    .catch(() => {
      if (loading) loading.style.display = 'none';
      renderFallback();
    });

  function renderFallback() {
    grid.innerHTML = `
      <article class="news-card featured-news">
        <div class="news-tag urgent">Breaking</div>
        <h3>TR to PR 2026 Pathway Announced — 33,000 Spots</h3>
        <p>IRCC has officially announced the new Temporary Resident to Permanent Resident pathway for 2026, offering 33,000 spots for eligible temporary residents already in Canada.</p>
        <div class="news-meta"><span>&#128197; March 1, 2026</span><span>&#128337; 4 min read</span></div>
      </article>
      <article class="news-card">
        <div class="news-tag">Express Entry</div>
        <h3>Draw #298: CRS Cutoff Drops to 524</h3>
        <p>The latest Express Entry draw issued 3,200 ITAs with a minimum CRS score of 524, continuing the downward trend from late 2025.</p>
        <div class="news-meta"><span>&#128197; March 5, 2026</span><span>&#128337; 3 min read</span></div>
      </article>
      <article class="news-card">
        <div class="news-tag">Policy</div>
        <h3>PGWP Rules Updated for 2026 Graduates</h3>
        <p>New PGWP eligibility rules now require programs to be on the updated DLI list. Check if your program qualifies before applying.</p>
        <div class="news-meta"><span>&#128197; February 20, 2026</span><span>&#128337; 5 min read</span></div>
      </article>
      <article class="news-card">
        <div class="news-tag">Atlantic</div>
        <h3>New Brunswick Expands PNP EOI Draws</h3>
        <p>NB PNP has increased EOI draw frequency to bi-weekly, targeting healthcare workers, ECE professionals, and skilled tradespeople.</p>
        <div class="news-meta"><span>&#128197; February 12, 2026</span><span>&#128337; 3 min read</span></div>
      </article>
      <article class="news-card">
        <div class="news-tag">OINP</div>
        <h3>Ontario Tech Draw Invites 2,400 Candidates</h3>
        <p>OINP's latest Human Capital Priorities tech draw targeted software developers, data analysts, and IT project managers.</p>
        <div class="news-meta"><span>&#128197; February 8, 2026</span><span>&#128337; 3 min read</span></div>
      </article>
      <article class="news-card">
        <div class="news-tag">Policy</div>
        <h3>IRCC Reduces Processing Times for Work Permits</h3>
        <p>Employer-specific work permits are now being processed in as little as 6 weeks, down from the previous 10-12 week average.</p>
        <div class="news-meta"><span>&#128197; January 28, 2026</span><span>&#128337; 2 min read</span></div>
      </article>
    `;
  }
})();
