export default class Brush {
  static get DEFAULT_OPTIONS() {
    return {
      minWidthPercentage: 0.02,
      initialWidthPercentage: 0.1,
      onMove() {}
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
    this.options.onMove(this.position, this.options);
  }

  initDom() {
    if (!this.root) {
      this.root = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.rectContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      this.lineLeft = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this.lineRight = document.createElementNS('http://www.w3.org/2000/svg', 'line');

      this.rect.setAttribute('stroke-width', '1');
      this.rect.setAttribute('fill', 'transparent');
      this.rect.setAttribute('stroke', '#bbd9ec80');

      this.rect.style.cursor = 'move'; // TODO: Move to class
      this.lineLeft.style.cursor = 'ew-resize'; // TODO: Move to class
      this.lineRight.style.cursor = 'ew-resize'; // TODO: Move to class

      this.root.appendChild(this.container);
      this.root.appendChild(this.rectContainer);
      this.rectContainer.appendChild(this.rect);
      this.rectContainer.appendChild(this.lineLeft);
      this.rectContainer.appendChild(this.lineRight);

      // TODO: Refactoring
      this.lineLeft.setAttribute('transform', `translate(${4}, 0)`);
      this.lineRight.setAttribute('transform', `translate(${-4}, 0)`);

      this.initLinePosition(this.lineLeft, this.options.brushHeight);
      this.initLinePosition(this.lineRight, this.options.brushHeight);
    }
  }

  // TODO: refactoring
  initLinePosition(line, y2) {
    line.setAttribute('y2', y2);
    line.setAttribute('stroke-width', '8');
    line.setAttribute('stroke', '#bbd9ec80');
  }

  dragStart(e) {
    this.startX = e.pageX;
    this.startRectX = this.position.x;
    this.startRectWidth = this.position.width;
    this.dragTarget = e.target;

    document.addEventListener('mouseup', this.dragEnd);
    document.addEventListener('mousemove', this.moveRect);
  }

  dragEnd() {
    this.startX = null;
    this.startRectX = null;
    this.startRectWidth = null;
    this.dragTarget = null;

    document.removeEventListener('mouseup', this.dragEnd);
    document.removeEventListener('mousemove', this.moveRect);
  }

  moveRect(e) {
    const dx = this.startX - e.pageX;

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
  }

  removeListeners() {
    this.rectContainer.removeEventListener('mousedown', this.dragStart);
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
    const { width, height, brushHeight, brushWidth} = this.options;
    const scaleX = brushWidth / width;
    const scaleY = brushHeight / height;

    this.root.setAttribute('transform', `translate(0, ${height})`);
    this.container.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
  }

  render(lines = []) {
    this.lines = lines;

    lines.forEach(node => this.container.appendChild(node));
  }

  attach(node, children) {
    this.render(children);
    node.appendChild(this.root);
    this.addListeners();
  }

  detach(node) {
    node.removeChild(this.root);
    this.removeListeners();
    this.root = null;
  }

  toggleLineVisibility(lineIndex, visible) {
    if (visible) {
      this.lines[lineIndex].setAttribute('stroke-width', 1);
    } else {
      this.lines[lineIndex].setAttribute('stroke-width', 0);
    }
  }
}
