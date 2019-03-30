import {
  classNames,
  isUndefined,
  createSvgElement
} from '../helper';

import styles from './index.module.css';

const cx = classNames.bind(styles);

export default class XAxis {
  static get DEFAULT_OPTIONS() {
    return {
      padding: 20,
      valuesAmount: 5,
      animationDuration: 200,
      dataFormatter: value => value
    };
  }

  constructor(data, options = {}) {
    this.data = data;
    this.cache = [];
    this.options = Object.assign({}, XAxis.DEFAULT_OPTIONS, options);
    this.root = createSvgElement('g');

    const { animationDuration } = this.options;

    this.root.style.animationDuration = `${animationDuration}ms`;
    this.root.style['-webkit-animation-duration'] = `${animationDuration}ms`;
  }

  render() {
    const { valuesAmount } = this.options;

    let text;

    for (let i = 0; i < valuesAmount; i++) {
      if (!text) {
        text = createSvgElement('text');
        text.setAttribute('class', cx('xAxisValue'));
      } else {
        text = text.cloneNode(false);
      }

      this.root.appendChild(text);
    }
  }

  updateValues(start, end) {
    if (this.root.children && this.root.children.length) {
      this.animationStart(start, end);
      this.setXAxisValues(start, end);
    }
  }

  animationStart(start, end) {
    const { animationDuration } = this.options;
    const prevRoot = this.root;

    if (this.prevStart && this.prevEnd && (this.prevStart !== start || this.prevEnd !== end)) {
      setTimeout(this.animationEnd.bind(this, prevRoot), animationDuration);

      this.root = this.root.cloneNode(true);

      const dLeft = this.prevStart - start;
      const dRight = this.prevEnd - end;
      const delta = dLeft - dRight;

      let moveLeft = true;

      if (!delta) {
        moveLeft = dLeft < 0;
      } else if (dLeft) {
        moveLeft = dLeft < 0;
      } else if (dRight) {
        moveLeft = dRight < 0;
      }

      const containerClass = cx(moveLeft ? 'fadeInRight' : 'fadeInLeft');
      const prevContainerClass = cx(moveLeft ? 'fadeOutLeft' : 'fadeOutRight');

      this.root.setAttribute('class', containerClass);
      prevRoot.setAttribute('class', prevContainerClass);

      this.parent.appendChild(this.root);
    }

    this.prevStart = start;
    this.prevEnd = end;
  }

  animationEnd(prevRoot) {
    this.parent.removeChild(prevRoot);
    this.root.setAttribute('class', '');
  }

  setXAxisValues(start, end) {
    const {
      valuesAmount,
      width,
      height,
      padding,
      dataFormatter
    } = this.options;

    const length = end - start;
    const actualAmount = Math.min(valuesAmount, length);
    const step = length / actualAmount;
    const diff = width / actualAmount;
    const children = this.root.children;

    for (let i = 0; i < valuesAmount; i++) {
      const child = children[i];

      if (i < actualAmount) {
        const index = Math.min(Math.round(start + (i * step)), this.data.length - 1);

        if (isUndefined(this.cache[index])) {
          this.cache[index] = dataFormatter(this.data[index]);
        }

        child.setAttribute('x', i * diff);
        child.setAttribute('y', height + padding); // TODO: Should have relative position
        child.textContent = this.cache[index];
        child.style.visibility = 'visible';
      } else {
        child.style.visibility = 'hidden';
      }
    }
  }

  attach(node) {
    this.parent = node;
    this.render();
    node.appendChild(this.root);
  }

  detach(node) {
    node.removeChild(this.root);
    this.root = null;
    this.parent = null;
  }
}
