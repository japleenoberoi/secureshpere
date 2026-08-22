// File Scanner Page — Magic Bytes / MIME Validation
import { FileScanner } from '../utils/fileScanner.js';
import { Api } from '../utils/api.js';
import { Session } from '../utils/session.js';
import { escapeHtml } from '../utils/html.js';

const scanner = new FileScanner();

export async function renderScanner() {
  const user = Session.getUser();
  let history = [];
  try {
    const response = await Api.getScans();
    history = response.scans.map(fromDatabaseScan);
  } catch {
    // The scanner remains usable if an older scan history cannot be loaded.
  }

  return `
    <div class="dashboard-page">
      <nav class="dash-nav">
        <div class="nav-brand">
          <span class="nav-logo">◉</span>
          <span class="nav-title">Orbit<span class="accent">Jobs</span></span>
        </div>
        <div class="nav-links">
          <a href="#/dashboard" class="nav-link" data-page="dashboard">
            <span class="nav-icon">🏠</span> Jobs
          </a>
          <a href="#/scanner" class="nav-link active" data-page="scanner">
            <span class="nav-icon">🔬</span> Scanner
          </a>
        </div>
        <div class="nav-user">
          <span class="user-avatar">${(user?.name || 'U')[0].toUpperCase()}</span>
          <span class="user-name">${user?.name || 'User'}</span>
          <button class="btn-icon-sm" id="btn-logout" title="Logout">⏻</button>
        </div>
      </nav>

      <main class="dash-main scanner-main">
        <div class="scanner-header">
          <h1>🔬 File Scanner</h1>
          <p>Analyze files for hidden threats using Magic Bytes detection. Upload any file to verify its true type and detect disguised malware.</p>
        </div>

        <div class="scanner-content">
          <div class="scanner-left">
            <!-- Upload Zone -->
            <div class="upload-zone glass-card" id="upload-zone">
              <div class="upload-visual">
                <div class="upload-orbit">
                  <div class="upload-ring"></div>
                  <div class="upload-ring ring-2"></div>
                  <div class="upload-core">📄</div>
                </div>
              </div>
              <h3>Drop files here</h3>
              <p>or click to browse</p>
              <p class="upload-formats">Supports: PDF, PNG, JPG, GIF, ZIP, DOCX, EXE, and more</p>
              <input type="file" id="file-input" multiple hidden>
            </div>

            <!-- Scanning Animation -->
            <div class="scan-animation glass-card" id="scan-animation" style="display:none;">
              <div class="scan-visual">
                <div class="scan-line"></div>
                <span class="scan-file-icon" id="scan-file-icon">📄</span>
              </div>
              <p class="scan-status" id="scan-status">Analyzing magic bytes...</p>
              <div class="scan-progress-bar">
                <div class="scan-progress-fill" id="scan-progress-fill"></div>
              </div>
            </div>

            <!-- How it works -->
            <div class="how-it-works glass-card">
              <h3>How Magic Bytes Detection Works</h3>
              <div class="steps">
                <div class="step">
                  <div class="step-num">1</div>
                  <div>
                    <strong>Read File Header</strong>
                    <p>First 16 bytes of the file are read as the "magic number" signature</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-num">2</div>
                  <div>
                    <strong>Match Signature</strong>
                    <p>Compared against a database of known file type signatures</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-num">3</div>
                  <div>
                    <strong>Verify Extension</strong>
                    <p>Checks if the file extension matches the detected content type</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-num">4</div>
                  <div>
                    <strong>Generate Verdict</strong>
                    <p>Files are classified as Clean, Suspicious, Dangerous, or Malicious</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="scanner-right">
            <div class="results-header">
              <h3>Scan Results</h3>
              <button class="btn btn-outline btn-xs" id="btn-clear-history">Clear All</button>
            </div>
            <div class="scan-results" id="scan-results">
              ${history.length > 0 ? history.map(r => renderScanResult(r)).join('') : `
                <div class="empty-results">
                  <span class="empty-icon">🔍</span>
                  <p>No files scanned yet</p>
                  <p class="empty-hint">Upload a file to analyze its contents</p>
                </div>
              `}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderScanResult(result) {
  const verdictClass = result.verdict.toLowerCase();
  return `
    <div class="result-card glass-card ${verdictClass}">
      <div class="result-header">
        <div class="result-file-info">
          <span class="result-verdict-icon">${result.verdictIcon || '❓'}</span>
          <div>
            <h4 class="result-filename">${escapeHtml(result.fileName)}</h4>
            <span class="result-size">${escapeHtml(result.fileSizeFormatted)}</span>
          </div>
        </div>
        <div class="result-verdict" style="color: ${result.verdictColor}">
          ${result.verdict}
        </div>
      </div>

      <div class="result-details">
        <div class="result-row">
          <span class="result-label">Extension</span>
          <span class="result-value">.${escapeHtml(result.declaredExtension || 'none')}</span>
        </div>
        <div class="result-row">
          <span class="result-label">Declared MIME</span>
          <span class="result-value">${escapeHtml(result.declaredMime)}</span>
        </div>
        <div class="result-row">
          <span class="result-label">Detected Type</span>
          <span class="result-value">${escapeHtml(result.detectedType || 'Unknown')}</span>
        </div>
        <div class="result-row">
          <span class="result-label">Magic Bytes</span>
          <code class="result-hex">${escapeHtml(result.magicBytes || 'N/A')}</code>
        </div>
      </div>

      ${result.details && result.details.length > 0 ? `
        <div class="result-messages">
          ${result.details.map(d => `
            <div class="result-message ${d.type}">
              ${escapeHtml(d.message)}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

export function initScanner(router) {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const scanResults = document.getElementById('scan-results');
  const btnLogout = document.getElementById('btn-logout');
  const btnClearHistory = document.getElementById('btn-clear-history');

  if (!uploadZone) return;

  // Logout
  btnLogout?.addEventListener('click', () => {
    Api.logout().catch(() => {}).finally(() => { Session.clear(); router.navigate('/'); });
  });

  // Clear history
  btnClearHistory?.addEventListener('click', () => {
    Api.clearScans().then(() => {
      if (!scanResults) return;
      scanResults.innerHTML = `
        <div class="empty-results">
          <span class="empty-icon">🔍</span>
          <p>No files scanned yet</p>
          <p class="empty-hint">Upload a file to analyze its contents</p>
        </div>
      `;
    }).catch(error => alert(error.message));
  });

  // Click to upload
  uploadZone.addEventListener('click', () => fileInput?.click());

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  // File input change
  fileInput?.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = ''; // Reset for re-upload
  });

  async function handleFiles(files) {
    if (!files || files.length === 0) return;

    for (const file of files) {
      await scanFile(file);
    }
  }

  async function scanFile(file) {
    const scanAnimation = document.getElementById('scan-animation');
    const scanStatus = document.getElementById('scan-status');
    const scanProgressFill = document.getElementById('scan-progress-fill');
    const scanFileIcon = document.getElementById('scan-file-icon');

    // Show scanning animation
    if (uploadZone) uploadZone.style.display = 'none';
    if (scanAnimation) scanAnimation.style.display = 'block';
    if (scanFileIcon) scanFileIcon.textContent = getFileEmoji(file.name);

    // Animate scan progress
    const steps = [
      { progress: 20, text: 'Reading file header...' },
      { progress: 45, text: 'Extracting magic bytes...' },
      { progress: 65, text: 'Matching signatures...' },
      { progress: 80, text: 'Validating MIME type...' },
      { progress: 95, text: 'Generating report...' },
    ];

    for (const step of steps) {
      if (scanProgressFill) scanProgressFill.style.width = `${step.progress}%`;
      if (scanStatus) scanStatus.textContent = step.text;
      await new Promise(r => setTimeout(r, 400));
    }

    // Actually scan
    const result = await scanner.scanFile(file);

    // Finish animation
    if (scanProgressFill) scanProgressFill.style.width = '100%';
    if (scanStatus) scanStatus.textContent = `Verdict: ${result.verdict}`;
    await new Promise(r => setTimeout(r, 500));

    // Persist only scan metadata, never the uploaded file or its contents.
    let storedResult = result;
    try {
      storedResult = fromDatabaseScan(await Api.saveScan(result));
    } catch (error) {
      alert(`Scan completed but could not be saved: ${error.message}`);
    }

    // Show result
    if (scanResults) {
      // Remove empty state if present
      const empty = scanResults.querySelector('.empty-results');
      if (empty) empty.remove();

      // Add result card at top
      const resultHTML = renderScanResult(storedResult);
      scanResults.insertAdjacentHTML('afterbegin', resultHTML);

      // Animate in
      const newCard = scanResults.firstElementChild;
      if (newCard) {
        newCard.classList.add('fade-in-up');
      }
    }

    // Reset upload zone
    if (scanAnimation) scanAnimation.style.display = 'none';
    if (uploadZone) uploadZone.style.display = 'flex';
    if (scanProgressFill) scanProgressFill.style.width = '0%';
  }
}

function fromDatabaseScan(row) {
  return {
    fileName: row.file_name ?? row.fileName,
    fileSize: row.file_size ?? row.fileSize,
    fileSizeFormatted: row.file_size_formatted ?? row.fileSizeFormatted,
    declaredExtension: row.declared_extension ?? row.declaredExtension,
    declaredMime: row.declared_mime ?? row.declaredMime,
    detectedType: row.detected_type ?? row.detectedType,
    magicBytes: row.magic_bytes ?? row.magicBytes,
    verdict: row.verdict,
    verdictColor: row.verdict_color ?? row.verdictColor,
    verdictIcon: row.verdict_icon ?? row.verdictIcon,
    details: row.details || [],
  };
}

function getFileEmoji(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    pdf: '📕', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📎', pptx: '📎',
    zip: '📦', rar: '📦', '7z': '📦', gz: '📦',
    exe: '⚙️', dll: '⚙️', sh: '⚙️', bat: '⚙️',
    mp3: '🎵', mp4: '🎬', webm: '🎬',
    html: '🌐', css: '🎨', js: '📜', json: '📋', xml: '📋',
  };
  return map[ext] || '📄';
}
