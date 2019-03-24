export default class Checkbox {
  static get DEFAULT_OPTIONS() {
    return {
      color: '#000',
      label: '',
      onChange() {}
    };
  }

  constructor(options = {}) {
    this.options = Object.assign({}, Checkbox.DEFAULT_OPTIONS, options);
    this.root = document.createElement('div');
    this.root.className = 'container';
  }

  addListeners() {
    this.root.querySelector('.input')
      .addEventListener('change', this.options.onChange);
  }

  removeListeners() {
    this.root.querySelector('.input')
      .removeEventListener('change', this.options.onChange);
  }

  render() {
    const { label, color } = this.options;

    this.root.innerHTML = `
      <label class="checkbox">
        <input type="checkbox" class="input" checked />
        <span class="tick" style="border-color: ${color}"></span>
        <span class="label">${label}</span>
      </label>
    `;
  }

  attach(node) {
    this.render();
    node.appendChild(this.root);
    this.addListeners();
  }

  detach(node) {
    node.removeChild(this.root);
    this.removeListeners();
    this.root = null;
  }
}
