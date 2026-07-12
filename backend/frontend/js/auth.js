/* ==========================================================================
   auth.js — Login page logic
   Handles: field validation, password visibility toggle, remember me,
   submit state (loading spinner), and dummy authentication until the
   real /auth/login endpoint is wired up.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return; // guard: auth.js only runs on login.html

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const alertBanner = document.getElementById('loginAlert');
  const alertText = document.getElementById('loginAlertText');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const submitBtnText = document.getElementById('loginBtnText');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');

  /* ---------- Prefill remembered email ---------- */
  const rememberedEmail = localStorage.getItem('assetflow_remembered_email');
  if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberMeCheckbox.checked = true;
  }

  /* ---------- Password visibility toggle ---------- */
  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePasswordBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    togglePasswordBtn.classList.toggle('is-active', isHidden);
  });

  /* ---------- Field-level validation helpers ---------- */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function setFieldError(input, errorEl, show) {
    input.classList.toggle('has-error', show);
    errorEl.classList.toggle('is-visible', show);
  }

  emailInput.addEventListener('input', () => {
    if (emailInput.value.trim() === '' || isValidEmail(emailInput.value)) {
      setFieldError(emailInput, emailError, false);
    }
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.value.length >= 6) {
      setFieldError(passwordInput, passwordError, false);
    }
  });

  function hideAlert() {
    alertBanner.classList.remove('is-visible');
  }

  function showAlert(message) {
    alertText.textContent = message;
    alertBanner.classList.add('is-visible');
  }

  function setSubmitLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtnText.textContent = isLoading ? '' : 'Sign in';
    if (isLoading) {
      submitBtn.insertAdjacentHTML('beforeend', '<span class="spinner" id="loginSpinner"></span>');
    } else {
      document.getElementById('loginSpinner')?.remove();
    }
  }

  /* ---------- Submit ---------- */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;
    if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, true);
      hasError = true;
    }
    if (password.length < 6) {
      setFieldError(passwordInput, passwordError, true);
      hasError = true;
    }
    if (hasError) return;

    setSubmitLoading(true);

    try {
      // Attempt real backend login; falls back to dummy auth if API is offline
      // so the frontend remains fully demoable without a backend.
      let result;
      try {
        result = await api.post(API_ENDPOINTS.login, { email, password });
      } catch (apiError) {
        result = await dummyLogin(email, password);
      }

      if (rememberMeCheckbox.checked) {
        localStorage.setItem('assetflow_remembered_email', email);
      } else {
        localStorage.removeItem('assetflow_remembered_email');
      }

      localStorage.setItem('assetflow_token', result.token);
      localStorage.setItem('assetflow_user', JSON.stringify(result.user));

      window.location.href = 'dashboard.html';
    } catch (error) {
      showAlert(error.message || 'Invalid email or password. Please try again.');
      setSubmitLoading(false);
    }
  });

  /* ---------- Forgot password ---------- */
  forgotPasswordLink.addEventListener('click', (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!isValidEmail(email)) {
      setFieldError(emailInput, emailError, true);
      emailInput.focus();
      return;
    }
    showAlert(`If an account exists for ${email}, a reset link has been sent.`);
    alertBanner.style.background = 'var(--color-info-bg)';
    alertBanner.style.color = '#1B6EA8';
    alertBanner.style.borderColor = '#BEE0F5';
  });

  /* ---------- Dummy auth (used until backend is connected) ---------- */
  function dummyLogin(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (password.length >= 6) {
          resolve({
            token: 'dummy-jwt-token',
            user: { name: 'Alex Morgan', email, role: 'Administrator' },
          });
        } else {
          reject(new Error('Invalid email or password. Please try again.'));
        }
      }, 700); // simulated network latency
    });
  }
});