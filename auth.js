/**
 * auth.js — Authentication service and controller for Chokosfera / Donut Sarajevo.
 *
 * AuthService  — thin wrapper around the /api/register and /api/login endpoints.
 * AuthController — wires DOM elements to AuthService and manages UI state.
 *
 * Token storage keys (localStorage):
 *   chokosferaToken  — raw JWT string
 *   chokosferaUser   — JSON object { id, name, email, isAdmin }
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
   * Resolve the API base URL at runtime so the
   * same file works both locally and on Railway.
   * ───────────────────────────────────────────── */
  var API_BASE = (function () {
    var host = window.location.hostname;
    var port = window.location.port;
    // When the HTML is served from a different port (e.g. live-server on 5500)
    // or opened as a file, point explicitly at the Node server.
    if (
      window.location.protocol === 'file:' ||
      (
        (host === 'localhost' || host === '127.0.0.1') &&
        port &&
        port !== '3000'
      )
    ) {
      return 'http://localhost:3000';
    }
    return '';
  })();

  /* ─────────────────────────────────────────────
   * Storage helpers
   * ───────────────────────────────────────────── */
  var TOKEN_KEY = 'chokosferaToken';
  var USER_KEY  = 'chokosferaUser';

  function saveSession(token, user) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) { /* ignore quota errors */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {}
  }

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || null; } catch (e) { return null; }
  }

  function getUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /* ─────────────────────────────────────────────
   * AuthService — API calls
   * ───────────────────────────────────────────── */
  function AuthService() {}

  /**
   * POST /api/login
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: object, isAdmin: boolean}>}
   */
  AuthService.prototype.login = function (email, password) {
    return fetch(API_BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error(data.error || data.message || 'Login failed');
        }
        return data;
      });
    });
  };

  /**
   * POST /api/register
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: object}>}
   */
  AuthService.prototype.register = function (name, email, password) {
    return fetch(API_BASE + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, password: password })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          throw new Error(data.error || data.message || 'Registration failed');
        }
        return data;
      });
    });
  };

  /**
   * GET /api/profile — verify a stored token is still valid.
   * @returns {Promise<object>} decoded user payload
   */
  AuthService.prototype.getProfile = function () {
    var token = getToken();
    if (!token) return Promise.reject(new Error('No token'));
    return fetch(API_BASE + '/api/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Unauthorized');
        return data.user;
      });
    });
  };

  /* ─────────────────────────────────────────────
   * AuthController — DOM wiring
   * ───────────────────────────────────────────── */
  function AuthController(service) {
    this.service = service;
  }

  /** Open the login/register modal and show the login screen. */
  AuthController.prototype.openModal = function () {
    var modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    this._showLoginScreen();
  };

  /** Close the modal and reset both screens. */
  AuthController.prototype.closeModal = function () {
    var modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    this._showLoginScreen();
  };

  /* ── Screen switching ── */
  AuthController.prototype._showLoginScreen = function () {
    var ls = document.getElementById('loginScreen');
    var rs = document.getElementById('registerScreen');
    if (ls) ls.classList.remove('hidden');
    if (rs) rs.classList.add('hidden');
    this._clearField('loginEmail');
    this._clearField('loginPassword');
    this._hideMsg('loginError');
    this._hideMsg('loginSuccess');
  };

  AuthController.prototype._showRegisterScreen = function () {
    var ls = document.getElementById('loginScreen');
    var rs = document.getElementById('registerScreen');
    if (ls) ls.classList.add('hidden');
    if (rs) rs.classList.remove('hidden');
    this._clearField('registerName');
    this._clearField('registerEmail');
    this._clearField('registerPassword');
    this._clearField('confirmPassword');
    this._hideMsg('registerError');
    this._hideMsg('registerSuccess');
  };

  /* ── Helpers ── */
  AuthController.prototype._clearField = function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  };

  AuthController.prototype._showMsg = function (id, text, isError) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    // Toggle error/success styling
    if (isError) {
      el.classList.add('form-error');
      el.classList.remove('form-success');
    } else {
      el.classList.add('form-success');
      el.classList.remove('form-error');
    }
  };

  AuthController.prototype._hideMsg = function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  };

  /* ── Navbar state ── */

  /**
   * Update the navbar to show the logged-in user's name and a logout button.
   * @param {string} name
   * @param {boolean} isAdmin
   */
  AuthController.prototype.showLoggedInUser = function (name, isAdmin) {
    var userIcon       = document.getElementById('userIcon');
    var userInfo       = document.getElementById('userInfo');
    var displayUsername = document.getElementById('displayUsername');
    var adminLink      = document.getElementById('adminLink');

    if (userIcon)        userIcon.classList.add('hidden');
    if (displayUsername) displayUsername.textContent = name;
    if (userInfo)        userInfo.classList.remove('hidden');
    if (adminLink) {
      if (isAdmin) adminLink.classList.remove('hidden');
      else         adminLink.classList.add('hidden');
    }
  };

  /** Revert the navbar to the logged-out state (show user icon, hide name). */
  AuthController.prototype.showLoggedOutUser = function () {
    var userIcon = document.getElementById('userIcon');
    var userInfo = document.getElementById('userInfo');
    if (userInfo) userInfo.classList.add('hidden');
    if (userIcon) userIcon.classList.remove('hidden');
  };

  /**
   * Read localStorage and restore the navbar to the correct state on page load.
   * Also validates the token against /api/profile to catch expired tokens.
   */
  AuthController.prototype.restoreSession = function () {
    var self = this;
    var user = getUser();
    var token = getToken();

    if (!user || !token) {
      self.showLoggedOutUser();
      return;
    }

    // Optimistically show the user while we verify the token
    self.showLoggedInUser(user.name || user.username || user.email, user.isAdmin || false);

    // Silently verify the token; clear session if it has expired
    self.service.getProfile().catch(function () {
      clearSession();
      self.showLoggedOutUser();
    });
  };

  /* ── Form submission handlers ── */

  /**
   * Handle the Login button click.
   * Reads #loginEmail and #loginPassword, calls AuthService.login,
   * stores the token + user, updates the navbar, and closes the modal.
   */
  AuthController.prototype.submitLogin = function () {
    var self = this;
    var emailEl    = document.getElementById('loginEmail');
    var passwordEl = document.getElementById('loginPassword');

    var email    = emailEl    ? emailEl.value.trim()    : '';
    var password = passwordEl ? passwordEl.value.trim() : '';

    if (!email || !password) {
      this._showMsg('loginError', 'Please enter both email and password.', true);
      return;
    }

    // Disable button while request is in flight
    var btn = document.querySelector('.login-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in…'; }

    this.service.login(email, password)
      .then(function (data) {
        var user = data.user || {};
        var token = data.token || '';
        var isAdmin = !!(data.isAdmin || user.isAdmin);

        // Normalise the stored user object — always include id, name, email
        var storedUser = {
          id:      user.id      || null,
          name:    user.name    || user.username || email.split('@')[0],
          email:   user.email   || email,
          isAdmin: isAdmin
        };

        saveSession(token, storedUser);
        self._showMsg('loginSuccess', data.message || 'Login successful!', false);
        self.showLoggedInUser(storedUser.name, isAdmin);

        if (isAdmin) {
          setTimeout(function () { window.location.href = 'admin.html'; }, 1200);
        } else {
          setTimeout(function () { self.closeModal(); }, 1200);
        }
      })
      .catch(function (err) {
        self._showMsg('loginError', err.message || 'Login failed.', true);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
      });
  };

  /**
   * Handle the Create Account button click.
   * Reads #registerName, #registerEmail, #registerPassword, #confirmPassword,
   * calls AuthService.register, stores the token + user, and closes the modal.
   */
  AuthController.prototype.submitRegister = function () {
    var self = this;
    var nameEl     = document.getElementById('registerName');
    var emailEl    = document.getElementById('registerEmail');
    var passwordEl = document.getElementById('registerPassword');
    var confirmEl  = document.getElementById('confirmPassword');

    var name     = nameEl     ? nameEl.value.trim()     : '';
    var email    = emailEl    ? emailEl.value.trim()    : '';
    var password = passwordEl ? passwordEl.value.trim() : '';
    var confirm  = confirmEl  ? confirmEl.value.trim()  : '';

    if (!name || !email || !password || !confirm) {
      this._showMsg('registerError', 'Please fill in all fields.', true);
      return;
    }
    if (password.length < 8) {
      this._showMsg('registerError', 'Password must be at least 8 characters long.', true);
      return;
    }
    if (password !== confirm) {
      this._showMsg('registerError', 'Passwords do not match.', true);
      return;
    }

    var btn = document.querySelector('.register-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

    this.service.register(name, email, password)
      .then(function (data) {
        var user  = data.user  || {};
        var token = data.token || '';

        var storedUser = {
          id:      user.id    || null,
          name:    user.name  || name,
          email:   user.email || email,
          isAdmin: false
        };

        // If the backend returned a token, log the user in immediately
        if (token) {
          saveSession(token, storedUser);
          self.showLoggedInUser(storedUser.name, false);
          self._showMsg('registerSuccess', data.message || 'Account created! Welcome!', false);
          setTimeout(function () { self.closeModal(); }, 1400);
        } else {
          self._showMsg('registerSuccess', data.message || 'Account created! Please log in.', false);
          setTimeout(function () { self._showLoginScreen(); }, 1600);
        }
      })
      .catch(function (err) {
        self._showMsg('registerError', err.message || 'Registration failed.', true);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
      });
  };

  /** Log the current user out: clear storage, update navbar. */
  AuthController.prototype.logout = function () {
    clearSession();
    this.showLoggedOutUser();
    // Soft reload to reset any in-memory state
    window.location.href = 'chokosfera.html';
  };

  /* ── Bootstrap ── */

  /**
   * Bind all DOM event listeners and restore the session.
   * Call this once after DOMContentLoaded.
   */
  AuthController.prototype.init = function () {
    var self = this;

    // Restore session from localStorage
    this.restoreSession();

    // User icon → open modal
    var userIcon = document.getElementById('userIcon');
    if (userIcon) {
      userIcon.addEventListener('click', function (e) {
        e.stopPropagation();
        self.openModal();
      });
    }

    // Close button inside modal
    var closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { self.closeModal(); });
    }

    // Click outside modal content → close
    var modal = document.getElementById('loginModal');
    if (modal) {
      modal.addEventListener('click', function () { self.closeModal(); });
      var content = modal.querySelector('.modal-content');
      if (content) {
        content.addEventListener('click', function (e) { e.stopPropagation(); });
      }
    }

    // Escape key → close modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') self.closeModal();
    });

    // Tab switching
    var registerTriggerBtn = document.querySelector('.register-trigger-btn');
    if (registerTriggerBtn) {
      registerTriggerBtn.addEventListener('click', function () { self._showRegisterScreen(); });
    }

    var backToLoginBtn = document.querySelector('.back-to-login-btn');
    if (backToLoginBtn) {
      backToLoginBtn.addEventListener('click', function () { self._showLoginScreen(); });
    }

    // Login submit
    var loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () { self.submitLogin(); });
    }

    // Allow Enter key in login fields
    ['loginEmail', 'loginPassword'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') self.submitLogin();
        });
      }
    });

    // Register submit
    var registerBtn = document.querySelector('.register-btn');
    if (registerBtn) {
      registerBtn.addEventListener('click', function () { self.submitRegister(); });
    }

    // Allow Enter key in register fields
    ['registerName', 'registerEmail', 'registerPassword', 'confirmPassword'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') self.submitRegister();
        });
      }
    });

    // Logout
    var logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        self.logout();
      });
    }
  };

  /* ─────────────────────────────────────────────
   * Expose on window so order.js and inline
   * scripts can access the token helper.
   * ───────────────────────────────────────────── */
  window.AuthService    = AuthService;
  window.AuthController = AuthController;
  window.getAuthToken   = getToken;
  window.getAuthUser    = getUser;
  window.clearAuthSession = clearSession;

  /* Auto-initialise when the DOM is ready */
  function bootstrap() {
    var authService    = new AuthService();
    var authController = new AuthController(authService);
    authController.init();
    window.authController = authController;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
