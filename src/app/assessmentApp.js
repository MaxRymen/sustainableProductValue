import { OpenAiProductAssessmentService } from '../services/openAiProductAssessmentService.js';
import { FileExtractor } from '../services/fileExtractor.js';
import ProgressIndicator from '../ui/progressIndicator.js';
import ErrorBanner from '../ui/errorBanner.js';
import ResultsRenderer from '../ui/resultsRenderer.js';
import FilePreview from '../ui/filePreview.js';

export class AssessmentApp {
  constructor({ config, formSelector = '#product-assessment-form', resultsSelector = '#results' }) {
    this.config = config;
    this.formSelector = formSelector;
    this.resultsSelector = resultsSelector;

    this.form = null;
    this.submitButton = null;
    this.resultsSection = null;
    this.fileInput = null;

    this.progressIndicator = null;
    this.errorBanner = null;
    this.resultsRenderer = null;
    this.filePreview = null;

    this.fileExtractor = new FileExtractor();
    this.service = new OpenAiProductAssessmentService(config?.openAI);
  }

  init() {
    this.form = document.querySelector(this.formSelector);
    this.resultsSection = document.querySelector(this.resultsSelector);
    this.submitButton = this.form?.querySelector('.submit-btn');
    this.fileInput = this.form?.querySelector('#product-docs');

    if (!this.form || !this.submitButton) {
      throw new Error('Assessment form could not be located in the DOM.');
    }

    this.progressIndicator = new ProgressIndicator({ form: this.form });
    this.errorBanner = new ErrorBanner({ mountBefore: this.form.querySelector('.form-actions') });
    this.resultsRenderer = new ResultsRenderer({ section: this.resultsSection });
    this.filePreview = new FilePreview({ anchor: this.fileInput });

    this.form.addEventListener('submit', event => this.handleSubmit(event));
    this.fileInput?.addEventListener('change', event => this.onFileSelection(event));
  }

  async handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(this.form);
    const productData = this.serializeForm(formData);

    if (!productData.name || !productData.description) {
      this.errorBanner.show('Please fill in all required fields (Product Name and Description).');
      return;
    }

    this.errorBanner.clear();
    this.progressIndicator.show();
    this.setLoadingState(true);

    try {
      productData.extractedTexts = await this.fileExtractor.extract(productData.files);

      const results = await this.service.assessProduct(productData, {
        onStepCompleted: (stepId, success) => {
          this.progressIndicator.completeStep(stepId, success);
        },
      });

      this.resultsRenderer.render(results);
    } catch (error) {
      console.error('Product assessment failed:', error);
      const message =
        error?.message ??
        'Assessment failed. Please try again or verify your OpenAI configuration.';
      this.errorBanner.show(message);
    } finally {
      this.setLoadingState(false);
      this.progressIndicator.destroy();
    }
  }

  serializeForm(formData) {
    const files = formData.getAll('product-docs').filter(Boolean);
    return {
      name: formData.get('product-name')?.trim(),
      description: formData.get('product-description')?.trim(),
      nbaProducts: formData.get('nba-products')?.trim(),
      additionalInfo: formData.get('additional-info')?.trim(),
      files,
    };
  }

  onFileSelection(event) {
    const files = event.target.files;
    if (files?.length) {
      this.filePreview.render(files);
    } else {
      this.filePreview.clear();
    }
  }

  setLoadingState(isLoading) {
    if (!this.submitButton) {
      return;
    }

    if (isLoading) {
      this.submitButton.disabled = true;
      this.submitButton.innerHTML = '<span class="loading-spinner"></span> Starting Analysis...';
    } else {
      this.submitButton.disabled = false;
      this.submitButton.textContent = 'Assess Product Value';
    }
  }
}

export default AssessmentApp;
