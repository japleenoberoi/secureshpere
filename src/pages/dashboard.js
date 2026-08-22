// Dashboard Page — Recommended Jobs with Trust Scores
import { Api } from '../utils/api.js';
import { Session } from '../utils/session.js';
import { escapeHtml } from '../utils/html.js';

let currentJobs = [];
let currentFilter = 'all';
let isModalOpen = false;

export function renderDashboard() {
  const user = Session.getUser();

  return `
    <div class="dashboard-page">
      <nav class="dash-nav">
        <div class="nav-brand">
          <span class="nav-logo">◉</span>
          <span class="nav-title">Orbit<span class="accent">Jobs</span></span>
        </div>
        <div class="nav-links">
          <a href="#/dashboard" class="nav-link active" data-page="dashboard">
            <span class="nav-icon">🏠</span> Jobs
          </a>
          <a href="#/scanner" class="nav-link" data-page="scanner">
            <span class="nav-icon">🔬</span> Scanner
          </a>
        </div>
        <div class="nav-user">
          <span class="user-avatar">${(user?.name || 'U')[0].toUpperCase()}</span>
          <span class="user-name">${user?.name || 'User'}</span>
          <button class="btn-icon-sm" id="btn-logout" title="Logout">⏻</button>
        </div>
      </nav>

      <main class="dash-main">
        <div class="dash-header">
          <div class="dash-title-section">
            <h1>Mission Control</h1>
            <p>Opportunities matched to your saved interests</p>
          </div>
          <div class="dash-actions">
            <button class="btn btn-outline btn-sm" id="btn-edit-interests">
              <span>⚙️</span> Edit Interests
            </button>
            <button class="btn btn-primary btn-sm" id="btn-rescan">
              <span>🔄</span> Re-scan
            </button>
          </div>
        </div>

        <!-- Scraping Progress -->
        <div class="scrape-progress" id="scrape-progress">
          <div class="progress-card glass-card">
            <div class="progress-header">
              <div class="scanner-pulse"></div>
              <h3>Loading opportunities</h3>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" id="progress-bar"></div>
            </div>
            <p class="progress-message" id="progress-message">Connecting to the job service…</p>
            <div class="source-log" id="source-log"></div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar" id="filter-bar" style="display:none;">
          <div class="filter-chips">
            <button class="filter-chip active" data-filter="all">All Jobs</button>
            <button class="filter-chip" data-filter="high">🛡️ Trusted</button>
            <button class="filter-chip" data-filter="medium">⚠️ Moderate</button>
            <button class="filter-chip" data-filter="danger">🚩 Flagged</button>
          </div>
          <div class="results-count" id="results-count"></div>
        </div>

        <!-- Jobs Grid -->
        <div class="jobs-grid" id="jobs-grid"></div>
      </main>

      <!-- Job Detail Modal -->
      <div class="modal-overlay" id="job-modal">
        <div class="modal-content glass-card" id="modal-content"></div>
      </div>
    </div>
  `;
}

export function initDashboard(router) {
  const btnLogout = document.getElementById('btn-logout');
  const btnEditInterests = document.getElementById('btn-edit-interests');
  const btnRescan = document.getElementById('btn-rescan');
  const modalOverlay = document.getElementById('job-modal');

  if (!btnLogout) return;

  btnLogout.addEventListener('click', () => {
    Api.logout().catch(() => {}).finally(() => { Session.clear(); router.navigate('/'); });
  });

  btnEditInterests?.addEventListener('click', () => {
    router.navigate('/interests');
  });

  btnRescan?.addEventListener('click', () => {
    startScraping();
  });

  // Filter chips
  document.querySelector('.filter-chips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderJobs();
  });

  // Modal close
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Jobs grid click delegation
  document.getElementById('jobs-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.job-card');
    if (card) {
      const jobId = card.dataset.jobId;
      openJobModal(jobId);
    }
  });

  // Keyboard escape to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) closeModal();
  });

  // Start scraping
  startScraping();
}

async function startScraping() {
  const progress = document.getElementById('scrape-progress');
  const progressBar = document.getElementById('progress-bar');
  const progressMessage = document.getElementById('progress-message');
  const sourceLog = document.getElementById('source-log');
  const filterBar = document.getElementById('filter-bar');
  const jobsGrid = document.getElementById('jobs-grid');

  if (!progress) return;

  progress.style.display = 'block';
  if (filterBar) filterBar.style.display = 'none';
  if (jobsGrid) jobsGrid.innerHTML = '';
  if (sourceLog) sourceLog.innerHTML = '';

  if (progressBar) progressBar.style.width = '60%';
  if (progressMessage) progressMessage.textContent = 'Loading opportunities…';
  try {
    const response = await Api.getJobs();
    currentJobs = Array.isArray(response.jobs) ? response.jobs.map(sanitizeJob) : [];
    if (progressBar) progressBar.style.width = '100%';
  } catch (error) {
    currentJobs = [];
    if (jobsGrid) jobsGrid.textContent = error.message;
  }
  progress.style.display = 'none';
  if (filterBar) filterBar.style.display = 'flex';
  renderJobs();
}

function renderJobs() {
  const grid = document.getElementById('jobs-grid');
  const resultsCount = document.getElementById('results-count');
  if (!grid) return;

  let filtered = currentJobs;
  if (currentFilter === 'high') filtered = currentJobs.filter(j => j.trustScore?.score >= 80);
  else if (currentFilter === 'medium') filtered = currentJobs.filter(j => j.trustScore?.score >= 50 && j.trustScore.score < 80);
  else if (currentFilter === 'danger') filtered = currentJobs.filter(j => (j.trustScore?.score || 0) < 50);

  if (resultsCount) resultsCount.textContent = `${filtered.length} opportunities found`;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-results"><p>No opportunities found.</p><p class="empty-hint">Try updating your interests or check back later.</p></div>';
    return;
  }
  grid.innerHTML = filtered.map((job, i) => {
    const score = Number(job.trustScore?.score) || 0;
    const trust = getTrustLevel(score);
    const icon = getTrustIcon(score);

    return `
      <div class="job-card glass-card fade-in-up" data-job-id="${job.id}" style="animation-delay: ${i * 60}ms">
        <div class="job-card-header">
          <div class="job-company-info">
            <div class="company-avatar" style="background: ${trust.bgColor}; color: ${trust.color}">
              ${job.company[0]}
            </div>
            <div>
              <h3 class="job-title">${job.title}</h3>
              <p class="job-company">${job.company}</p>
            </div>
          </div>
          <div class="trust-badge" style="background: ${trust.bgColor}; color: ${trust.color}; border: 1px solid ${trust.color}30">
            <span class="trust-icon">${icon}</span>
            <span class="trust-score">${score}</span>
          </div>
        </div>
        <p class="job-description">${job.description}</p>
        <div class="job-meta">
          <span class="meta-item"><span class="meta-icon">📍</span> ${job.location}</span>
          <span class="meta-item"><span class="meta-icon">💰</span> ${job.salary}</span>
          <span class="meta-item"><span class="meta-icon">⏰</span> ${job.posted}</span>
        </div>
        <div class="job-tags">
          ${job.requirements.slice(0, 3).map(r => `<span class="tag">${r}</span>`).join('')}
        </div>
        ${score < 25 ? `<div class="scam-warning"><span>☠️</span> This listing has been flagged as a potential scam</div>` : ''}
      </div>
    `;
  }).join('');
}

function openJobModal(jobId) {
  const job = currentJobs.find(j => j.id === jobId);
  if (!job) return;

  const modal = document.getElementById('job-modal');
  const content = document.getElementById('modal-content');
  if (!modal || !content) return;

  const score = Number(job.trustScore?.score) || 0;
  const trust = getTrustLevel(score);
  const breakdown = job.trustScore?.breakdown || [];
  const icon = getTrustIcon(score);

  content.innerHTML = `
    <button class="modal-close" id="modal-close-btn">✕</button>
    <div class="modal-header">
      <div class="modal-company-avatar" style="background: ${trust.bgColor}; color: ${trust.color}">
        ${job.company[0]}
      </div>
      <div>
        <h2 class="modal-title">${job.title}</h2>
        <p class="modal-company">${job.company} · ${job.type}</p>
      </div>
    </div>

    <div class="modal-body">
      <div class="modal-section">
        <div class="modal-meta-grid">
          <div class="modal-meta-item">
            <span class="modal-meta-icon">📍</span>
            <div>
              <span class="modal-meta-label">Location</span>
              <span class="modal-meta-value">${job.location}</span>
            </div>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-icon">💰</span>
            <div>
              <span class="modal-meta-label">Salary</span>
              <span class="modal-meta-value">${job.salary}</span>
            </div>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-icon">⏰</span>
            <div>
              <span class="modal-meta-label">Posted</span>
              <span class="modal-meta-value">${job.posted}</span>
            </div>
          </div>
          <div class="modal-meta-item">
            <span class="modal-meta-icon">📡</span>
            <div>
              <span class="modal-meta-label">Source</span>
              <span class="modal-meta-value">${job.trust.source}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <h3>Description</h3>
        <p>${job.description}</p>
      </div>

      <div class="modal-section">
        <h3>Requirements</h3>
        <div class="modal-requirements">
          ${job.requirements.map(r => `<span class="req-tag">${r}</span>`).join('')}
        </div>
      </div>

      <div class="modal-section trust-analysis">
        <h3>${icon} Trust Analysis</h3>
        <div class="trust-overall" style="border-color: ${trust.color}30; background: ${trust.bgColor}">
          <div class="trust-score-big" style="color: ${trust.color}">${score}</div>
          <div class="trust-label-big">${trust.label}</div>
          <div class="trust-meter">
            <div class="trust-meter-fill" style="width: ${score}%; background: ${trust.color}"></div>
          </div>
        </div>
        <div class="trust-breakdown">
          ${breakdown.map(item => `
            <div class="trust-row">
              <span class="trust-row-icon">${item.icon}</span>
              <span class="trust-row-label">${item.label}</span>
              <span class="trust-row-detail">${item.detail}</span>
              <div class="trust-row-bar">
                <div class="trust-row-fill" style="width: ${item.value}%; background: ${getBarColor(item.value)}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      ${score < 25 ? `
        <div class="modal-scam-alert">
          <h3>☠️ Scam Warning</h3>
          <p>This listing exhibits multiple red flags commonly associated with job scams:</p>
          <ul>
            ${!job.trust.verified ? '<li>Company is not verified</li>' : ''}
            ${job.trust.domainAge < 1 ? '<li>Domain was recently created</li>' : ''}
            ${job.trust.reviews < 2 ? '<li>Very few or no reviews</li>' : ''}
            ${!job.trust.ssl ? '<li>No SSL certificate (insecure)</li>' : ''}
            <li>Source: ${job.trust.source} (unverified platform)</li>
          </ul>
          <p><strong>Recommendation:</strong> Do NOT apply. Do NOT share personal information.</p>
        </div>
      ` : ''}
    </div>

    <div class="modal-footer">
      ${score >= 50 ? `
        <button class="btn btn-primary">Apply Now →</button>
        <button class="btn btn-outline">Save Job</button>
      ` : `
        <button class="btn btn-danger">⚠️ Report Listing</button>
        <button class="btn btn-outline">Dismiss</button>
      `}
    </div>
  `;

  modal.classList.add('active');
  isModalOpen = true;

  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

  // Animate trust bars
  setTimeout(() => {
    content.querySelectorAll('.trust-row-fill').forEach(bar => {
      bar.style.transition = 'width 0.8s ease';
    });
  }, 100);
}

function closeModal() {
  const modal = document.getElementById('job-modal');
  if (modal) modal.classList.remove('active');
  isModalOpen = false;
}

function getBarColor(value) {
  if (value >= 70) return '#00E5A0';
  if (value >= 40) return '#FFB84D';
  return '#FF6B6B';
}

function getTrustLevel(score) {
  if (score >= 80) return { label: 'Trusted', color: '#00E5A0', bgColor: 'rgba(0,229,160,0.1)' };
  if (score >= 50) return { label: 'Moderate', color: '#FFB84D', bgColor: 'rgba(255,184,77,0.1)' };
  return { label: 'Caution', color: '#FF6B6B', bgColor: 'rgba(255,107,107,0.1)' };
}

function getTrustIcon(score) {
  if (score >= 80) return '✓';
  if (score >= 50) return '!';
  return '⚠';
}

function sanitizeJob(job) {
  const text = value => escapeHtml(value ?? 'Not provided');
  return {
    ...job,
    id: String(job.id ?? ''),
    title: text(job.title), company: text(job.company), location: text(job.location), salary: text(job.salary),
    type: text(job.type), posted: text(job.posted), description: text(job.description),
    requirements: Array.isArray(job.requirements) ? job.requirements.map(text) : [],
    trust: { ...(job.trust || {}), source: text(job.trust?.source) },
    trustScore: {
      score: Math.max(0, Math.min(100, Number(job.trustScore?.score) || 0)),
      breakdown: Array.isArray(job.trustScore?.breakdown) ? job.trustScore.breakdown.map(item => ({ ...item, label: text(item.label), detail: text(item.detail), icon: text(item.icon), value: Math.max(0, Math.min(100, Number(item.value) || 0)) })) : [],
    },
  };
}
