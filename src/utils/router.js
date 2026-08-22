// Lightweight hash-based SPA router with page transitions
export class Router {
  constructor(appElement) {
    this.app = appElement;
    this.routes = {};
    this.currentRoute = null;
    this.beforeNavigate = null;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    // Initialization can occur after the window load event (for example, after
    // restoring a session), so always render the current route immediately.
    queueMicrotask(() => this.handleRoute());
  }

  addRoute(path, renderFn) {
    this.routes[path] = renderFn;
  }

  setGuard(guardFn) {
    this.beforeNavigate = guardFn;
  }

  navigate(path) {
    window.location.hash = path;
  }

  getCurrentRoute() {
    return window.location.hash.slice(1) || '/';
  }

  async handleRoute() {
    const path = this.getCurrentRoute();

    // Run guard
    if (this.beforeNavigate) {
      const redirectPath = this.beforeNavigate(path);
      if (redirectPath && redirectPath !== path) {
        this.navigate(redirectPath);
        return;
      }
    }

    const renderFn = this.routes[path] || this.routes['/404'];
    if (!renderFn) return;

    // Animate out
    this.app.classList.add('page-exit');
    await this.wait(250);

    // Render new page
    this.app.innerHTML = '';
    const page = await renderFn();
    this.app.innerHTML = page;
    this.currentRoute = path;

    // Animate in
    this.app.classList.remove('page-exit');
    this.app.classList.add('page-enter');

    // Trigger page-specific initialization
    window.dispatchEvent(new CustomEvent('page-loaded', { detail: { path } }));

    await this.wait(300);
    this.app.classList.remove('page-enter');
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
