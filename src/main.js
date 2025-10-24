import { CONFIG } from '../config.js';
import { AssessmentApp } from './app/assessmentApp.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new AssessmentApp({ config: CONFIG });
    app.init();
    console.log('Assessment app initialised.');
  } catch (error) {
    console.error('Failed to initialise assessment app:', error);
  }
});
