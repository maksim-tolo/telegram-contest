import {
  classNames,
  createSvgElement
} from '../helper';

import styles from './index.module.css';

const cx = classNames.bind(styles);

export default class Brush {
  static get DEFAULT_OPTIONS() {
    return {
      minWidthPercentage: 0.02,
      initialWidthPercentage: 0.1,
      onMove() {},
      brushOffset: 0
    };
  }

  constructor(options = {}) {
    this.options = Object.assign({}, Brush.DEFAULT_OPTIONS, {
      brushHeight: options.height,
      brushWidth: options.width
    }, options);

    this.lines = [];

    if (!this.options.minWidth) {
      this.options.minWidth = this.options.minWidthPercentage * this.options.brushWidth;
    }

    if (!this.options.initialWidth) {
      this.options.initialWidth = this.options.initialWidthPercentage * this.options.brushWidth;
    }

    this.dragStart = this.dragStart.bind(this);
    this.dragEnd = this.dragEnd.bind(this);
    this.moveRect = this.moveRect.bind(this);

    this.initDom();
    this.setSize();
    this.initRectPosition();
    this.updateRectPosition();
  }

  initDom() {
    if (!this.root) {
      this.root = createSvgElement('g');
      this.container = createSvgElement('g');
      this.rectContainer = createSvgElement('g');
      this.rect = createSvgElement('rect');
      this.lineLeft = createSvgElement('line');
      this.lineRight = createSvgElement('line');

      this.container.setAttribute('class', cx('container'));
      this.rect.setAttribute('class', cx('rectangle'));
      this.lineLeft.setAttribute('class', cx('lineLeft'));
      this.lineRight.setAttribute('class', cx('lineRight'));

      this.lineLeft.setAttribute('y2', this.options.brushHeight);
      this.lineRight.setAttribute('y2', this.options.brushHeight);

      this.root.appendChild(this.container);
      this.root.appendChild(this.rectContainer);
      this.rectContainer.appendChild(this.rect);
      this.rectContainer.appendChild(this.lineLeft);
      this.rectContainer.appendChild(this.lineRight);
    }
  }

  dragStart(e) {
    this.startX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
    this.startRectX = this.position.x;
    this.startRectWidth = this.position.width;
    this.dragTarget = e.target;

    document.addEventListener('mouseup', this.dragEnd);
    document.addEventListener('mousemove', this.moveRect);
    document.addEventListener('touchend', this.dragEnd);
    document.addEventListener('touchmove', this.moveRect);
  }

  dragEnd() {
    this.startX = null;
    this.startRectX = null;
    this.startRectWidth = null;
    this.dragTarget = null;

    document.removeEventListener('mouseup', this.dragEnd);
    document.removeEventListener('mousemove', this.moveRect);
    document.removeEventListener('touchend', this.dragEnd);
    document.removeEventListener('moveRect', this.moveRect);
  }

  moveRect(e) {
    const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
    const dx = this.startX - pageX;

    let x = this.position.x;
    let width = this.position.width;

    if (this.dragTarget === this.rect) {
      x = Math.min(Math.max(this.startRectX - dx, 0), this.options.brushWidth - this.startRectWidth);
    } else if (this.dragTarget === this.lineLeft) {
      const totalWidth = this.startRectX + this.startRectWidth;

      x = Math.min(Math.max(this.startRectX - dx, 0), totalWidth - this.options.minWidth);
      width = totalWidth - x;
    } else if (this.dragTarget === this.lineRight) {
      width = Math.min(Math.max(this.startRectWidth - dx, this.options.minWidth), this.options.brushWidth - this.startRectX);
    }

    if (x !== this.position.x || width !== this.position.width) {
      this.position.x = x;
      this.position.width = width;
      this.updateRectPosition();
      this.options.onMove(this.position, this.options);
    }
  }

  addListeners() {
    this.rectContainer.addEventListener('mousedown', this.dragStart);
    this.rectContainer.addEventListener('touchstart', this.dragStart);
  }

  removeListeners() {
    this.rectContainer.removeEventListener('mousedown', this.dragStart);
    this.rectContainer.removeEventListener('touchstart', this.dragStart);
  }

  initRectPosition() {
    const { initialWidth, brushHeight, brushWidth } = this.options;

    this.position = {
      x: brushWidth - initialWidth,
      y: 0,
      width: initialWidth,
      height: brushHeight
    };
  }

  updateRectPosition() {
    const { x, y, width, height } = this.position;

    this.rectContainer.setAttribute('transform', `translate(${x}, ${y})`);
    this.rect.setAttribute('width', width);
    this.rect.setAttribute('height', height);
    this.lineRight.setAttribute('x1', width);
    this.lineRight.setAttribute('x2', width);
  }

  setSize() {
    const { width, height, brushHeight, brushWidth, brushOffset } = this.options;
    const scaleX = brushWidth / width;
    const scaleY = brushHeight / height;

    this.root.setAttribute('transform', `translate(0, ${height + brushOffset})`);
    this.container.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
  }

  render(lines = []) {
    this.lines = lines;
    this.linesVisibility = Array(this.lines.length).fill(true);

    lines.forEach(node => this.container.appendChild(node));
  }

  attach(node, children) {
    this.render(children);
    node.appendChild(this.root);
    this.addListeners();
    this.options.onMove(this.position, this.options);
  }

  detach(node) {
    node.removeChild(this.root);
    this.removeListeners();
    this.root = null;
  }

  getYMaxOfVisibleLines() {
    const { edges } = this.options;

    let yMax = 0;

    this.linesVisibility.forEach((isVisible, index) => {
      if (isVisible && edges[index] > yMax) {
        yMax = edges[index];
      }
    });

    return yMax;
  }

  toggleLineVisibility(lineIndex, visible) {
    this.linesVisibility[lineIndex] = visible;
    this.lines[lineIndex].style.opacity = visible ? 1 : 0;

    this.scale();
  }

  scale() {
    const visibleYMax = this.getYMaxOfVisibleLines();

    if (visibleYMax) {
      const { width, height, brushHeight, brushWidth, yMax } = this.options;
      const scaleYVisible = yMax / visibleYMax;
      const dy = height / scaleYVisible - height;
      const scaleX = brushWidth / width;
      const scaleY = brushHeight / height * scaleYVisible;

      this.container.setAttribute('transform', `scale(${scaleX}, ${scaleY}) translate(0, ${dy})`);
    }
  }
}
