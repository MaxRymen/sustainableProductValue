const DEFAULT_STEPS = [
  { id: 'step-segmentation', icon: '👥', label: 'Customer Segmentation' },
  { id: 'step-nba', icon: '🔍', label: 'NBA Analysis' },
  { id: 'step-nba-value', icon: '💲', label: 'NBA Value Estimation' },
  { id: 'step-value', icon: '💎', label: 'Value Differentiators' },
  { id: 'step-willingness', icon: '💰', label: 'Willingness to Pay' },
  { id: 'step-communication', icon: '💬', label: 'Customer Communication' },
  { id: 'step-guidance', icon: '🎯', label: 'Company Guidance' },
];

export class ProgressIndicator {
  constructor({ form, steps = DEFAULT_STEPS } = {}) {
    this.form = form;
    this.steps = steps;
    this.container = null;
  }

  show() {
    if (this.container) {
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'progress-container';
    this.container.innerHTML = `
      <div class="progress-indicator">
        <h4>📊 Assessment Progress</h4>
        <div class="progress-steps">
          ${this.steps
            .map(
              step => `
            <div class="progress-step" id="${step.id}">
              <span class="step-icon">${step.icon}</span>
              <span class="step-text">${step.label}</span>
              <span class="step-status spinning-hourglass">⏳</span>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;

    const insertionPoint = this.form ?? document.querySelector('form');
    if (insertionPoint?.parentNode) {
      insertionPoint.parentNode.insertBefore(this.container, insertionPoint.nextSibling);
    } else {
      document.body.appendChild(this.container);
    }
  }

  completeStep(stepId, isSuccess = true) {
    const stepElement = this.container?.querySelector(`#${stepId}`);
    if (!stepElement) {
      return;
    }

    const statusElement = stepElement.querySelector('.step-status');
    if (!statusElement) {
      return;
    }

    statusElement.classList.remove('spinning-hourglass');
    statusElement.textContent = isSuccess ? '✅' : '⚠️';
    stepElement.classList.add(isSuccess ? 'completed' : 'warning');
  }

  destroy() {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
  }
}

export default ProgressIndicator;
