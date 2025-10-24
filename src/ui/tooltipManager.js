class TooltipManager {
  constructor() {
    this.tooltipElement = null;
  }

  attach(root) {
    const targets = root.querySelectorAll('[data-tooltip]');
    targets.forEach(target => {
      target.addEventListener('mouseenter', event => this.show(event, target.dataset.tooltip));
      target.addEventListener('mouseleave', () => this.hide());
    });
  }

  show(event, text) {
    if (!text) {
      return;
    }

    this.hide();

    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'tooltip';
    this.tooltipElement.textContent = text;
    document.body.appendChild(this.tooltipElement);

    const rect = event.target.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    const top = rect.top - tooltipRect.height - 10;

    this.tooltipElement.style.left = `${Math.max(left, 8)}px`;
    this.tooltipElement.style.top = `${Math.max(top, 8)}px`;

    requestAnimationFrame(() => {
      this.tooltipElement?.classList.add('show');
    });
  }

  hide() {
    if (this.tooltipElement?.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }
    this.tooltipElement = null;
  }
}

export const tooltipManager = new TooltipManager();
export default tooltipManager;
