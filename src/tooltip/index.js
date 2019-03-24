import { isNumber, classNames } from '../helper';

import styles from './index.module.css';

const cx = classNames.bind(styles);

export default class Tooltip {
  static get DEFAULT_OPTIONS() {
    return {
      offset: 10,
      width: 100
    };
  }

  constructor(options = {}) {
    this.options = Object.assign({}, Tooltip.DEFAULT_OPTIONS, options);
    this.root = document.createElement('div');
    this.root.className = cx('tooltipContainer');
    this.root.style.top=`${this.options.offset}px`;
    this.root.style.width=`${this.options.width}px`;
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
