/* Folio Demo — Shared Utilities */

// ── Mobile sidebar toggle ──────────────────────────────────
function initMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Insert backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  backdrop.addEventListener('click', closeSidebar);
  document.body.appendChild(backdrop);

  // Insert hamburger button into navbar
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const btn = document.createElement('button');
    btn.className = 'hamburger-btn';
    btn.setAttribute('aria-label', 'Menú');
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    btn.addEventListener('click', toggleSidebar);
    navbar.insertBefore(btn, navbar.firstChild);
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const isOpen = sidebar && sidebar.classList.contains('open');
  isOpen ? closeSidebar() : openSidebar();
}

function openSidebar() {
  document.querySelector('.sidebar')?.classList.add('open');
  document.querySelector('.sidebar-backdrop')?.classList.add('open');
}

function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-backdrop')?.classList.remove('open');
}

// Auto-close sidebar when a nav link is clicked on mobile
document.addEventListener('click', e => {
  if (e.target.closest('.sidebar-item')) closeSidebar();
});

// Init on DOM ready
document.addEventListener('DOMContentLoaded', initMobileSidebar);

// Simulate progress bar animation
function animateProgress(selector, durationMs, onComplete) {
  const bar = document.querySelector(selector);
  if (!bar) return;
  let pct = 0;
  const steps = durationMs / 80;
  const increment = 100 / steps;
  const interval = setInterval(() => {
    pct = Math.min(pct + increment + (Math.random() * increment * .5), 96);
    bar.style.width = pct + '%';
    if (pct >= 96) {
      clearInterval(interval);
      setTimeout(() => {
        bar.style.width = '100%';
        setTimeout(onComplete, 200);
      }, 300);
    }
  }, 80);
}

// Show overlay
function showOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// Navigate after delay
function navigateAfter(url, delayMs) {
  setTimeout(() => { window.location.href = url; }, delayMs);
}

// Simple file drop simulation
function initDropzone(dropzoneId, inputId) {
  const zone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files, zone);
  });
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => handleFiles(input.files, zone));
}

function handleFiles(files, zone) {
  if (!files || files.length === 0) return;
  const container = zone.querySelector('.file-chips');
  if (!container) return;
  Array.from(files).forEach(f => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${f.name}<span class="remove" onclick="this.parentElement.remove()">×</span>`;
    container.appendChild(chip);
  });
  zone.querySelector('.dropzone-empty') && (zone.querySelector('.dropzone-empty').style.display = 'none');
}
