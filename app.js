const state = {
  activeView: 'home',
  activeBusinessId: 'play-it-forward',
  modal: null,
};

const views = [...document.querySelectorAll('[data-page]')];
const navButtons = [...document.querySelectorAll('[data-view]')];
const overlay = document.getElementById('overlay');
const quickAddSheet = document.getElementById('quickAddSheet');
const commandPalette = document.getElementById('commandPalette');
const commandInput = document.getElementById('commandInput');
const businessSheet = document.getElementById('businessSheet');
const toast = document.getElementById('toast');

function setView(viewName) {
  state.activeView = viewName;
  views.forEach(view => view.classList.toggle('active', view.dataset.page === viewName));
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function openModal(modal) {
  closeModal(false);
  state.modal = modal;
  overlay.hidden = false;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  if (modal === commandPalette) setTimeout(() => commandInput.focus(), 50);
}

function closeModal(hideOverlay = true) {
  [quickAddSheet, commandPalette, businessSheet].forEach(item => item.hidden = true);
  state.modal = null;
  if (hideOverlay) overlay.hidden = true;
  document.body.style.overflow = '';
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2400);
}

navButtons.forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));

document.getElementById('quickAddBtn').addEventListener('click', () => openModal(quickAddSheet));
document.getElementById('mobileAddBtn').addEventListener('click', () => openModal(quickAddSheet));
document.querySelectorAll('[data-open-add]').forEach(btn => btn.addEventListener('click', () => openModal(quickAddSheet)));

document.getElementById('searchTrigger').addEventListener('click', () => openModal(commandPalette));

document.getElementById('businessSwitcher').addEventListener('click', () => openModal(businessSheet));
document.getElementById('mobileBusinessSwitcher').addEventListener('click', () => openModal(businessSheet));

overlay.addEventListener('click', () => closeModal());
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal()));

document.querySelectorAll('[data-command-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    setView(btn.dataset.commandView);
    closeModal();
  });
});

document.querySelectorAll('.quick-card').forEach(btn => {
  btn.addEventListener('click', () => showToast(`${btn.querySelector('strong').textContent} will be activated in its build phase.`));
});

document.getElementById('openSettings').addEventListener('click', () => showToast('Settings architecture is reserved for the next foundation pass.'));
document.getElementById('notificationBtn').addEventListener('click', () => showToast('No notifications yet.'));

commandInput.addEventListener('input', event => {
  const term = event.target.value.trim().toLowerCase();
  document.querySelectorAll('.command-result').forEach(result => {
    result.hidden = term && !result.textContent.toLowerCase().includes(term);
  });
});

document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    openModal(commandPalette);
  }
  if (event.key === 'Escape' && state.modal) closeModal();
});

// Phase 0 intentionally uses no network requests and stores no sensitive data.
// Later phases will replace this lightweight state object with a typed persistence layer.
