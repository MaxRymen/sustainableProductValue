export class FilePreview {
  constructor({ anchor }) {
    this.anchor = anchor;
    this.container = null;
  }

  render(files) {
    if (!files || files.length === 0) {
      this.clear();
      return;
    }

    this.container = this.container ?? this.createContainer();
    this.container.innerHTML = '<h4>📄 Uploaded Files:</h4>';

    Array.from(files).forEach(file => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <span class="file-name">${file.name}</span>
        <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
        <span class="file-type">${file.type || 'unknown type'}</span>
      `;
      this.container.appendChild(item);
    });
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'file-preview';

    const parent = this.anchor?.parentNode;
    if (parent) {
      parent.insertBefore(container, this.anchor.nextSibling);
    } else {
      console.warn('File preview anchor not found; appending to body.');
      document.body.appendChild(container);
    }

    return container;
  }

  clear() {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

export default FilePreview;
