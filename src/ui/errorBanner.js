export class ErrorBanner {
  constructor({ mountBefore } = {}) {
    this.mountBefore = mountBefore;
    this.element = null;
  }

  show(message) {
    this.clear();

    this.element = document.createElement('div');
    this.element.className = 'error-message';
    this.element.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span>${message}</span>
      </div>
    `;

    if (this.mountBefore?.parentNode) {
      this.mountBefore.parentNode.insertBefore(this.element, this.mountBefore);
    } else {
      document.body.insertBefore(this.element, document.body.firstChild);
    }
  }

  clear() {
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

export default ErrorBanner;
