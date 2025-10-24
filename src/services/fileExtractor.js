/**
 * Handles reading and text extraction for uploaded assessment files.
 */
export class FileExtractor {
  constructor({ maxCharacters = 3000 } = {}) {
    this.maxCharacters = maxCharacters;
  }

  /**
   * Extract text content for each file in the provided list.
   * @param {FileList|File[]} files
   * @returns {Promise<Array<{ filename: string, text: string }>>}
   */
  async extract(files) {
    if (!files || files.length === 0) {
      return [];
    }

    const fileArray = Array.from(files);
    const extractionPromises = fileArray.map(async file => {
      const text = await this.extractFromFile(file);
      return { filename: file.name, text };
    });

    return Promise.all(extractionPromises);
  }

  /**
   * Route extraction based on MIME type with graceful fallbacks.
   * @param {File} file
   * @returns {Promise<string>}
   */
  async extractFromFile(file) {
    if (!file || !file.type) {
      return '';
    }

    const mimeType = file.type.toLowerCase();

    if (mimeType === 'application/pdf') {
      return this.extractFromPdf(file);
    }

    if (mimeType.startsWith('text/')) {
      return this.extractFromTextFile(file);
    }

    // Some browsers report Word documents as empty mimetypes, attempt text read.
    return this.extractFromTextFile(file);
  }

  /**
   * Extract text from PDF files via pdf.js.
   * @param {File} file
   * @returns {Promise<string>}
   */
  async extractFromPdf(file) {
    const pdfjs = window.pdfjsLib;
    if (!pdfjs) {
      console.warn('pdf.js library not found – PDF content cannot be extracted.');
      return '';
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async event => {
        try {
          const typedArray = new Uint8Array(event.target.result);
          const loadingTask = pdfjs.getDocument({ data: typedArray });
          const pdf = await loadingTask.promise;
          let textContent = '';

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            textContent += content.items.map(item => item.str).join(' ') + '\n';
          }

          resolve(this.truncate(textContent));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract raw text from plain-text-like files.
   * @param {File} file
   * @returns {Promise<string>}
   */
  async extractFromTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = event => {
        const text = typeof event.target.result === 'string' ? event.target.result : '';
        resolve(this.truncate(text));
      };

      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Limit text lengths to avoid token overflows when hitting the API.
   * @param {string} text
   * @returns {string}
   */
  truncate(text) {
    if (!text) {
      return '';
    }

    if (text.length <= this.maxCharacters) {
      return text.trim();
    }

    return `${text.substring(0, this.maxCharacters).trim()}...[truncated]`;
  }
}

export default FileExtractor;
