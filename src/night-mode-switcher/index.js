import {
  classNames,
  createElement
} from '../helper';

import styles from './index.module.css';

const cx = classNames.bind(styles);

export default class NightModeSwitcher {
  static get DEFAULT_OPTIONS() {
    return {
      saveKey: 'darkMode',
      onToggle() {}
    };
  }

  static getSavedTheme(key) {
    if (localStorage) {
      const value = localStorage.getItem(key);

      if (value) {
        return JSON.parse(value);
      }

      return matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  }

  static saveTheme(key, isDarkMode) {
    if (localStorage) {
      localStorage.setItem(key, isDarkMode);
    }
  }

  constructor(options = {}) {
    this.options = Object.assign({}, NightModeSwitcher.DEFAULT_OPTIONS, options);
    this.root = createElement('div');
    this.root.className = cx('nightModeSwitcher');
    this.isDarkMode = NightModeSwitcher.getSavedTheme(this.options.saveKey);
    this.updateDom();
    this.toggleTheme = this.toggleTheme.bind(this);
  }

  updateDom() {
    this.root.textContent = this.isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode';

    if (this.options.onToggle) {
      this.options.onToggle(this.isDarkMode);
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;

    this.updateDom();
    NightModeSwitcher.saveTheme(this.options.saveKey, this.isDarkMode);
  }

  addListeners() {
    this.root.addEventListener('click', this.toggleTheme);
  }

  removeListeners() {
    this.root.removeEventListener('click', this.toggleTheme);
  }

  attach(node) {
    node.appendChild(this.root);
    this.addListeners();
  }

  detach(node) {
    node.removeChild(this.root);
    this.removeListeners();
    this.root = null;
  }
}
