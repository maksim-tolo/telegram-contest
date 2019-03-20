export default class Brush {
  static get DEFAULT_OPTIONS() {
    return {
      minWidthPercentage: 0.01,
      initialWidthPercentage: 0.1,
      onMove() {}
    };
  }

  constructor(options = {}) {
    this.options = Object.assign({}, Brush.DEFAULT_OPTIONS, {
      brushHeight: options.height,
      brushWidth: options.width
    }, options);

    if (!this.options.minWidth) {
      this.options.minWidth = this.options.minWidthPercentage * this.options.brushWidth;
    }

    if (!this.options.initialWidth) {
      this.options.initialWidth = this.options.initialWidthPercentage * this.options.brushWidth;
    }

    this.maxX = this.options.brushWidth - this.options.initialWidth;

    this.dragStart = this.dragStart.bind(this);
    this.dragEnd = this.dragEnd.bind(this);
    this.moveRect = this.moveRect.bind(this);

    this.initDom();
    this.initListeners();
    this.setSize();
    this.initRectPosition();
    this.updateRectPosition();
    this.options.onMove(this.position);
  }

  initDom() {
    if (!this.root) {
      this.root = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

      this.rect.setAttribute('stroke-width', '2');
      this.rect.setAttribute('fill', 'transparent');
      this.rect.setAttribute('stroke', 'currentColor');

      this.rect.style.cursor = 'move'; // TODO: Move to class

      this.root.appendChild(this.container);
      this.root.appendChild(this.rect);
    }
  }

  dragStart(e) {
    this.startX = e.pageX;
    this.startRectX = this.position.x;

    document.addEventListener('mouseup', this.dragEnd);
    document.addEventListener('mousemove', this.moveRect);
  }

  dragEnd() {
    this.startX = null;
    this.startRectX = null;

    document.removeEventListener('mouseup', this.dragEnd);
    document.removeEventListener('mousemove', this.moveRect);
  }

  moveRect(e) {
    const dx = this.startX - e.pageX;
    const newX = Math.min(Math.max(this.startRectX - dx, 0), this.maxX);

    if (newX !== this.position.x) {
      this.position.x = newX;
      this.updateRectPosition();
      this.options.onMove(this.position);
    }
  }

  initListeners() {
    this.rect.addEventListener('mousedown', this.dragStart);
  }

  initRectPosition() {
    const { initialWidth, brushHeight } = this.options;

    this.position = {
      x: this.maxX,
      y: 0,
      width: initialWidth,
      height: brushHeight
    };
  }

  updateRectPosition() {
    const { x, y, width, height } = this.position;

    this.rect.setAttribute('x', x);
    this.rect.setAttribute('y', y);
    this.rect.setAttribute('width', width);
    this.rect.setAttribute('height', height);
  }

  setSize() {
    const { width, height, brushHeight, brushWidth} = this.options;
    const scaleX = brushWidth / width;
    const scaleY = brushHeight / height;

    this.root.setAttribute('transform', `translate(0, ${height})`);
    this.container.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
  }

  render(nodes) {
    nodes.forEach(node => this.container.appendChild(node));
  }

  attach(node) {
    node.appendChild(this.root);

    return this;
  }
}
