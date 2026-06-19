/**
 * Quest Log contact form — posts to /api/contact without exposing recipient email.
 */
const QuestForm = (() => {
  const API_ENDPOINT = '/api/contact';

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const FIELD_MAP = {
    'error-name': 'adventurer-name',
    'error-email': 'return-path',
    'error-quest': 'quest-message',
  };

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
    const inputEl = document.getElementById(FIELD_MAP[id]);
    if (inputEl) inputEl.classList.toggle('error', !!message);
  }

  function clearErrors() {
    ['error-name', 'error-email', 'error-quest'].forEach((id) => showError(id, ''));
  }

  function validate(form) {
    clearErrors();
    let valid = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const quest = form.quest.value.trim();

    if (!name) {
      showError('error-name', 'Every adventurer needs a name.');
      valid = false;
    } else if (name.length < 2) {
      showError('error-name', 'Name must be at least 2 characters.');
      valid = false;
    }

    if (!email) {
      showError('error-email', 'A return path is required.');
      valid = false;
    } else if (!validateEmail(email)) {
      showError('error-email', 'Enter a valid email address.');
      valid = false;
    }

    if (!quest) {
      showError('error-quest', 'Tell us — what quest are you on?');
      valid = false;
    } else if (quest.length < 10) {
      showError('error-quest', 'Share a bit more about your quest (10+ characters).');
      valid = false;
    }

    return valid;
  }

  function setLoading(loading) {
    const btn = document.getElementById('submit-btn');
    const text = btn?.querySelector('.submit-text');
    const loadingEl = btn?.querySelector('.submit-loading');
    if (btn) btn.disabled = loading;
    if (text) text.classList.toggle('hidden', loading);
    if (loadingEl) loadingEl.classList.toggle('hidden', !loading);
  }

  function setStatus(message, type = '') {
    const status = document.getElementById('form-status');
    if (!status) return;
    status.textContent = message;
    status.className = 'form-status' + (type ? ` ${type}` : '');
  }

  async function submit(form) {
    if (!validate(form)) return;

    // Honeypot check
    if (form.website?.value) return;

    setLoading(true);
    setStatus('');

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      quest: form.quest.value.trim(),
    };

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus('Your quest has been logged. Link will respond when the path is clear.', 'success');
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(data.error || 'The path is blocked. Try again soon.', 'error');
      }
    } catch {
      setStatus(
        'Quest delivery awaits deployment. Connect the Worker to send your message to the hero.',
        'info'
      );
    } finally {
      setLoading(false);
    }
  }

  function init() {
    const form = document.getElementById('quest-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submit(form);
    });

    form.querySelectorAll('.form-input').forEach((input) => {
      input.addEventListener('input', () => {
        const errorId = {
          name: 'error-name',
          email: 'error-email',
          quest: 'error-quest',
        }[input.name];
        if (errorId) showError(errorId, '');
      });
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  QuestForm.init();
});