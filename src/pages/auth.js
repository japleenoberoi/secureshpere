// Auth Page — Login / Create Account
import { Api } from '../utils/api.js';
import { Session } from '../utils/session.js';

export function renderAuth() {
  return `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-logo">
          <div class="logo-orbit">
            <div class="orbit-ring"></div>
            <div class="orbit-dot"></div>
          </div>
          <h1 class="logo-text">Orbit<span class="logo-accent">Jobs</span></h1>
          <p class="auth-subtitle">Navigate the job galaxy safely</p>
        </div>

        <div class="auth-card glass-card" id="auth-card">
          <!-- Login Form (default) -->
          <div id="login-form" class="auth-form active">
            <h2 class="auth-title">Welcome Back</h2>
            <p class="auth-desc">Sign in to your mission control</p>
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" placeholder="astronaut@orbit.jobs" autocomplete="email">
              <span class="input-glow"></span>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password">
              <span class="input-glow"></span>
            </div>
            <button class="btn btn-primary btn-full" id="btn-login">
              <span class="btn-text">Launch In</span>
              <span class="btn-icon">→</span>
            </button>
          </div>

          <!-- Register Form -->
          <div id="register-form" class="auth-form">
            <h2 class="auth-title">Create Account</h2>
            <p class="auth-desc">Start your journey across the stars</p>
            <div class="form-group">
              <label for="reg-name">Full Name</label>
              <input type="text" id="reg-name" placeholder="Neil Armstrong" autocomplete="name">
              <span class="input-glow"></span>
            </div>
            <div class="form-group">
              <label for="reg-email">Email</label>
              <input type="email" id="reg-email" placeholder="astronaut@orbit.jobs" autocomplete="email">
              <span class="input-glow"></span>
            </div>
            <div class="form-group">
              <label for="reg-password">Password</label>
              <input type="password" id="reg-password" placeholder="••••••••" autocomplete="new-password">
              <span class="input-glow"></span>
            </div>
            <button class="btn btn-primary btn-full" id="btn-register">
              <span class="btn-text">Create Account</span>
              <span class="btn-icon">🚀</span>
            </button>
          </div>

          <!-- Toggle Buttons -->
          <div class="auth-toggle">
            <button class="toggle-btn active" id="toggle-login">Login</button>
            <button class="toggle-btn" id="toggle-register">Create Account</button>
            <div class="toggle-slider" id="toggle-slider"></div>
          </div>

          <div id="auth-error" class="auth-error"></div>
        </div>

        <div class="auth-features">
          <div class="feature-chip"><span class="chip-icon">🛡️</span> Scam Protection</div>
          <div class="feature-chip"><span class="chip-icon">🔍</span> Smart Scraping</div>
          <div class="feature-chip"><span class="chip-icon">📄</span> File Scanner</div>
        </div>
      </div>
    </div>
  `;
}

export function initAuth(router) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const toggleLogin = document.getElementById('toggle-login');
  const toggleRegister = document.getElementById('toggle-register');
  const toggleSlider = document.getElementById('toggle-slider');
  const authError = document.getElementById('auth-error');

  if (!toggleLogin) return;

  // Toggle between login and register
  toggleLogin.addEventListener('click', () => {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    toggleLogin.classList.add('active');
    toggleRegister.classList.remove('active');
    toggleSlider.style.transform = 'translateX(0)';
    authError.textContent = '';
  });

  toggleRegister.addEventListener('click', () => {
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    toggleRegister.classList.add('active');
    toggleLogin.classList.remove('active');
    toggleSlider.style.transform = 'translateX(100%)';
    authError.textContent = '';
  });

  // Login handler
  document.getElementById('btn-login')?.addEventListener('click', () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError(authError, 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      showError(authError, 'Please enter a valid email');
      return;
    }

    authenticate(Api.login(email, password));
  });

  // Register handler
  document.getElementById('btn-register')?.addEventListener('click', () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
      showError(authError, 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      showError(authError, 'Please enter a valid email');
      return;
    }

    if (password.length < 12) {
      showError(authError, 'Password must be at least 12 characters');
      return;
    }

    authenticate(Api.register(name, email, password));
  });

  async function authenticate(request) {
    try {
      const result = await request;
      if (result.requiresEmailConfirmation) {
        showError(authError, 'Account created. Check your email, confirm your account, then sign in.');
        toggleLogin.click();
        document.getElementById('login-email').value = result.user.email;
        return;
      }
      Session.setUser(result.user);
      await Session.hydrate();
      router.navigate(Session.getInterestIds().length > 0 ? '/dashboard' : '/interests');
    } catch (error) {
      showError(authError, error.message);
    }
  }

  // Enter key support
  document.querySelectorAll('.auth-form input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const activeForm = document.querySelector('.auth-form.active');
        const btn = activeForm.querySelector('.btn-primary');
        btn?.click();
      }
    });
  });
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
