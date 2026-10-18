/* HOA P24 — Accessible, keyboard-friendly student auth forms.
   Keeps the existing auth functions and backend workflow; adds native form
   validation, implicit Enter submission, mismatch checks, and double-submit guard. */
(function (global, document) {
  'use strict';

  var formHandlers = {
    login: 'loginStudent',
    'free-login': 'freeGateLoginSubmit',
    'free-register': 'registerFreeCandidate',
    'paid-register': 'registerStudent',
    'password-recovery': 'completeStudentPasswordRecovery'
  };

  function setMessage(message, isSuccess) {
    var output = document.getElementById('studentAuthMessage');
    if (output) {
      output.textContent = message;
      output.style.color = isSuccess ? '#17633a' : '#b42318';
    }
    if (!output && typeof global.setMessage === 'function') {
      global.setMessage(message, isSuccess);
    }
  }

  function bindPasswordMatch(passwordId, confirmId) {
    var password = document.getElementById(passwordId);
    var confirm = document.getElementById(confirmId);
    if (!password || !confirm || confirm.dataset.hoaMatchBound === '1') return;
    confirm.dataset.hoaMatchBound = '1';

    function validateMatch() {
      if (!confirm.value) {
        confirm.setCustomValidity('');
      } else if (password.value !== confirm.value) {
        confirm.setCustomValidity('The passwords do not match.');
      } else {
        confirm.setCustomValidity('');
      }
    }

    password.addEventListener('input', validateMatch);
    password.addEventListener('change', validateMatch);
    confirm.addEventListener('input', validateMatch);
    confirm.addEventListener('change', validateMatch);
    validateMatch();
  }

  function bindForm(form) {
    if (!form || form.dataset.hoaFormBound === '1') return;
    var action = formHandlers[form.getAttribute('data-hoa-auth-form')];
    if (!action) return;
    form.dataset.hoaFormBound = '1';

    form.addEventListener('submit', async function (event) {
      // The backend auth functions are the only submit destinations.
      event.preventDefault();
      if (form.dataset.hoaSubmitting === '1') return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var handler = global[action];
      if (typeof handler !== 'function') {
        setMessage('This form could not be started. Refresh the page and try again.');
        return;
      }

      form.dataset.hoaSubmitting = '1';
      form.setAttribute('aria-busy', 'true');
      var submitButtons = Array.prototype.slice.call(form.querySelectorAll('button[type="submit"]'));
      var previousDisabled = submitButtons.map(function (button) { return button.disabled; });
      submitButtons.forEach(function (button) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      });

      try {
        await Promise.resolve(handler.call(global));
      } catch (error) {
        console.error('Student auth form submission failed', error);
        setMessage('The request could not be completed. Please try again.');
      } finally {
        form.dataset.hoaSubmitting = '0';
        form.removeAttribute('aria-busy');
        submitButtons.forEach(function (button, index) {
          button.disabled = previousDisabled[index];
          if (previousDisabled[index]) button.setAttribute('aria-disabled', 'true');
          else button.removeAttribute('aria-disabled');
        });
      }
    });
  }

  function initialise() {
    document.querySelectorAll('form[data-hoa-auth-form]').forEach(bindForm);
    bindPasswordMatch('freeRegPassword', 'freeRegPasswordConfirm');
    bindPasswordMatch('hoaRecoveryPassword', 'hoaRecoveryPasswordConfirm');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
})(window, document);
