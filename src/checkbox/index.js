import {
  classNames,
  createElement
} from '../helper';

import styles from './index.module.css';

const cx = classNames.bind(styles);

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
    this.root = createElement('div');
    this.root.className = cx('container');
  }

  addListeners() {
    this.root.querySelector('.' + cx('input'))
      .addEventListener('change', this.options.onChange);
  }

  removeListeners() {
    this.root.querySelector('.' + cx('input'))
      .removeEventListener('change', this.options.onChange);
  }

  render() {
    const { label, color } = this.options;

    this.root.innerHTML = `
      <label class="${cx('checkbox')}">
        <input type="checkbox" class="${cx('input')}" checked />
        <span class="${cx('tick')}" style="border-color: ${color}"></span>
        <span class="${cx('label')}">${label}</span>
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
