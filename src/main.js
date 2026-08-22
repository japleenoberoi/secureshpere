// OrbitJobs — Main Application Entry Point
import { Router } from './utils/router.js';
import { Session } from './utils/session.js';
import { renderAuth, initAuth } from './pages/auth.js';
import { renderInterests, initInterests } from './pages/interests.js';
import { renderDashboard, initDashboard } from './pages/dashboard.js';
import { renderScanner, initScanner } from './pages/scanner.js';

// Create star field background
function createStarField() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let stars = [];
  let animationId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
      const alpha = star.opacity * (0.5 + twinkle * 0.5);

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
      ctx.fill();

      // Subtle drift
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    }

    animationId = requestAnimationFrame(draw);
  }

  resize();
  initStars();
  draw();

  window.addEventListener('resize', () => {
    resize();
    initStars();
  });
}

// Initialize app
async function init() {
  await Session.hydrate();
  const app = document.getElementById('app');
  const router = new Router(app);

  // Route guard — redirect based on auth state
  router.setGuard((path) => {
    const user = Session.getUser();
    const interests = Session.getInterestIds();

    if (path === '/' || path === '') {
      if (user && interests.length > 0) return '/dashboard';
      if (user) return '/interests';
      return '/';
    }

    if (path !== '/' && !user) return '/';
    if (path === '/dashboard' && interests.length === 0) return '/interests';
    if (path === '/scanner' && interests.length === 0) return '/interests';

    return path;
  });

  // Register routes
  router.addRoute('/', () => renderAuth());
  router.addRoute('/interests', () => renderInterests());
  router.addRoute('/dashboard', () => renderDashboard());
  router.addRoute('/scanner', () => renderScanner());
  router.addRoute('/404', () => '<div class="error-page"><h1>Lost in Space</h1><p>This route doesn\'t exist.</p><a href="#/">Return Home</a></div>');

  // Page initialization after render
  window.addEventListener('page-loaded', (e) => {
    const path = e.detail.path;
    switch (path) {
      case '/': initAuth(router); break;
      case '/interests': initInterests(router); break;
      case '/dashboard': initDashboard(router); break;
      case '/scanner': initScanner(router); break;
    }
  });

  // Start star field
  createStarField();
}

document.addEventListener('DOMContentLoaded', init);
