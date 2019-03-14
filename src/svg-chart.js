import ChartController from './chart-controller';

export default class SvgChart {
  constructor(data, options) {
    this.controller = new ChartController(options);
    this.controller.prepareData(data).scale();
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

    if (height) {
      this.rescale();
    }
  }

  rescale() {
    const { start, end } = this.controller.data.scale || {};

    this.controller.scale(start, end);
  }

  createLine(x1, y1, x2, y2, color) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);

    return line;
  }

  createVertex(x, y, r) {
    const vertex = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    vertex.setAttribute('cx', x);
    vertex.setAttribute('cy', y);
    vertex.setAttribute('r', r);

    return vertex;
  }

  /**
   * @public
   */
  render() {

  }
}
