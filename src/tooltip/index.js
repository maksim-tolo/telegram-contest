import { isNumber } from '../helper';

export default class Tooltip {
  static get DEFAULT_OPTIONS() {
    return {
      offset: 10
    };
  }

  constructor(options = {}) {
    this.options = Object.assign({}, Tooltip.DEFAULT_OPTIONS, options);
    this.root = document.createElement('div');
    this.root.className = 'tooltipContainer';
    this.root.style.top=`${this.options.offset}px`;
    this.toggleVisibility(false);
  }

  updatePosition({ x, y }) {
    const { offset } = this.options;

    if (isNumber(x)) {
      this.root.style.left = `${x + offset}px`;
    }

    if (isNumber(y)) {
      this.root.style.top = `${y + offset}px`;
    }
  }

  toggleVisibility(isVisible) {
    if (isVisible !== this.isVisible) {
      this.root.style.display = isVisible ? 'block' : 'none';
      this.isVisible = isVisible;
    }
  }

  updateContent(content) {
    this.root.innerHTML = content;
  }

  attach(node) {
    node.appendChild(this.root);
  }

  detach(node) {
    node.removeChild(this.root);
    this.root = null;
  }
}
