import ChartController from './chart-controller';

export default class SvgChart {
  constructor(data, options) {
    this.controller = new ChartController(options);
    this.controller.prepareData(data).scale();
    this.children = {};
    this.initRoot();
  }

  // TODO: Add padding
  initRoot() {
    if (!this.root) {
      this.root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    }

    const { width, height } = this.controller.options;

    this.root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.root.setAttribute('width', `${width}px`);
    this.root.setAttribute('height', `${height}px`);
  }

  /**
   * @public
   * TODO
   */
  toggleLineVisibility(field, isVisible = true) {
    this.controller.updateLine();
    this.rescale();
  }

  /**
   * @public
   */
  resize({ width, height }) {
    this.controller.updateOptions({ width, height });
    this.rescale();
    this.initRoot();
  }

  rescale() {
    const { start, end } = this.controller.data.scale || {};

    this.controller.scale(start, end);
  }

  getLine({ x1, y1, x2, y2, color = '#000', key }) {
    const lineKey = `line_${key}`;

    let line = this.children[lineKey];

    if (!line) {
      line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', color);

      this.children[lineKey] = line;
    }

    line.setAttribute('x1', x1);
    line.setAttribute('y1', this.controller.options.height - y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', this.controller.options.height - y2);

    return line;
  }

  getVertex({ x, y, r = 2, key }) {
    const vertexKey = `vertex_${key}`;

    let vertex = this.children[vertexKey];

    if (!vertex) {
      vertex = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      vertex.setAttribute('r', r);

      this.children[vertexKey] = vertex;
    }

    vertex.setAttribute('cx', x);
    vertex.setAttribute('cy', this.controller.options.height - y);

    return vertex;
  }

  render() {
    const { xAxis, lines, start, length } = this.controller.data.scale;

    Object.keys(lines).forEach((lineName) => {
      xAxis.forEach((x, index) => {
        const y = lines[lineName][index];
        const key = `${lineName}_${start + index}`;

        this.root.appendChild(this.getVertex({
          x,
          y,
          key
        }));

        if (index <= length - 2) {
          this.root.appendChild(this.getLine({
            x1: x,
            y1: y,
            x2: xAxis[index + 1],
            y2: lines[lineName][index + 1],
            key
          }));
        }
      });
    });
  }

  /**
   * @public
   */
  attach(node) {
    node.appendChild(this.root);

    return this;
  }
}
