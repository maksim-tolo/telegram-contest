export default class Brush {
  constructor(options = {}) {
    this.options = options;

    this.initRoot();
    this.setSize();
  }

  initRoot() {
    if (!this.root) {
      this.root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    }
  }

  setSize() {
    const { width, height, brushHeight = height, brushWidth = width} = this.options;

    this.root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.root.setAttribute('width', brushWidth);
    this.root.setAttribute('height', brushHeight);
    this.root.setAttribute('preserveAspectRatio', 'none');
  }

  render(nodes) {
    nodes.forEach(node => this.root.appendChild(node));
  }

  attach(node) {
    node.appendChild(this.root);

    return this;
  }
}
