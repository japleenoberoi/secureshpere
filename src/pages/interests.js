// Interests Selection Page
import { Api } from '../utils/api.js';
import { Session } from '../utils/session.js';
import { escapeHtml } from '../utils/html.js';

export async function renderInterests() {
  let data;
  try {
    data = await Api.getInterests();
  } catch (error) {
    return `<div class="interests-page"><div class="interests-container"><div class="empty-results"><p>${escapeHtml(error.message)}</p></div></div></div>`;
  }
  const savedInterests = data.selectedIds || [];
  const interestCards = (data.categories || []).map(cat => {
    const isSelected = savedInterests.includes(cat.id);
    return `
      <div class="interest-card ${isSelected ? 'selected' : ''}" 
           data-interest-id="${escapeHtml(cat.id)}" 
           style="--accent-color: ${escapeHtml(cat.color || '#00D4FF')}">
        <div class="interest-icon">${escapeHtml(cat.icon || '')}</div>
        <h3 class="interest-label">${escapeHtml(cat.label)}</h3>
        <div class="interest-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="interest-glow"></div>
      </div>
    `;
  }).join('');

  return `
    <div class="interests-page">
      <div class="interests-container">
        <div class="interests-header">
          <h1>Select Your Interests</h1>
          <p>Choose at least <strong>3 categories</strong> to personalize your job feed. Our autonomous scraper will scan the web for matching opportunities.</p>
          <div class="selected-count" id="selected-count">
            <span id="count-number">0</span> selected
          </div>
        </div>

        <div class="interests-grid" id="interests-grid">
          ${interestCards}
        </div>

        <div class="interests-footer">
          <button class="btn btn-primary btn-lg" id="btn-continue" disabled>
            <span class="btn-text">Launch Job Scanner</span>
            <span class="btn-icon">🚀</span>
          </button>
          <p class="hint-text">You can change these later from your dashboard</p>
        </div>
      </div>
    </div>
  `;
}

export function initInterests(router) {
  const grid = document.getElementById('interests-grid');
  const continueBtn = document.getElementById('btn-continue');
  const countNumber = document.getElementById('count-number');

  if (!grid) return;

  const selectedInterests = new Set(Session.getInterestIds());
  updateCount();

  // Card click handler
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.interest-card');
    if (!card) return;

    const id = card.dataset.interestId;

    if (selectedInterests.has(id)) {
      selectedInterests.delete(id);
      card.classList.remove('selected');
    } else {
      selectedInterests.add(id);
      card.classList.add('selected');
      // Add pop animation
      card.classList.add('pop');
      setTimeout(() => card.classList.remove('pop'), 300);
    }

    updateCount();
  });

  // Continue button
  continueBtn?.addEventListener('click', async () => {
    if (selectedInterests.size === 0) return;
    continueBtn.disabled = true;
    try {
      const ids = [...selectedInterests];
      await Api.saveInterests(ids);
      Session.setInterestIds(ids);
      router.navigate('/dashboard');
    } catch (error) {
      continueBtn.disabled = false;
      alert(error.message);
    }
  });

  function updateCount() {
    const count = selectedInterests.size;
    if (countNumber) countNumber.textContent = count;

    if (continueBtn) {
      continueBtn.disabled = count === 0;
      if (count > 0) {
        continueBtn.classList.add('ready');
      } else {
        continueBtn.classList.remove('ready');
      }
    }
  }
}
