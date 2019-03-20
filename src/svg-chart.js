import ChartModel from './chart-model';
import Brush from './brush';

export default class SvgChart {
  constructor(data, options = {
    withBrush: true,
    brushHeight: 100,
  }) {
    this.vertexes = {};
    this.lines = {};

    this.model = new ChartModel(options);
    this.model.prepareData(data).scale();
    const { width, height } = this.model.options;

    if (options.withBrush) {
      this.brush = new Brush({
        width,
        height,
        brushHeight: options.brushHeight,
      });
    }

    this.model.transform(options.scale ? 20 : 0, options.scale ? 50 : this.model.data.length);

    this.initRoot();
  }

  // TODO: Add padding
  initRoot() {
    if (!this.root) {
      this.root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      this.root.appendChild(this.container);
    }

    const { width, height } = this.model.options;
    const { scaleX, scaleY, dx, dy } = this.model.data.transform;

    this.container.setAttribute('transform', `scale(${scaleX},${scaleY}) translate(${dx}, ${dy})`);
    this.root.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.root.setAttribute('width', width);
    this.root.setAttribute('height', height);
  }

  /**
   * @public
   * TODO
   */
  toggleLineVisibility(field, isVisible = true) {
    this.model.updateLine();
    this.transform();
  }

  /**
   * @public
   */
  resize({ width, height }) {
    this.model.updateOptions({ width, height });
    this.transform();
    this.initRoot();
  }

  transform() {
    this.model.transform();
  }

  getLine({ x1, y1, x2, y2, color = '#000', key }) {
    const lineKey = `line_${key}`;

    let line = this.lines[lineKey];

    if (!line) {
      line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', color);

      this.lines[lineKey] = line;
    }

    line.setAttribute('x1', x1);
    line.setAttribute('y1', this.model.options.height - y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', this.model.options.height - y2);
    line.setAttribute('vector-effect', 'non-scaling-stroke');

    return line;
  }

  getVertex({ x, y, r = 2, key }) {
    const vertexKey = `vertex_${key}`;

    let vertex = this.vertexes[vertexKey];

    if (!vertex) {
      vertex = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      vertex.setAttribute('r', r);

      this.vertexes[vertexKey] = vertex;
    }

    vertex.setAttribute('cx', x);
    vertex.setAttribute('cy', this.model.options.height - y);
    vertex.setAttribute('stroke-width', '1');
    vertex.setAttribute('fill', 'transparent');
    vertex.setAttribute('vector-effect', 'non-scaling-stroke');
    vertex.setAttribute('data-key', key);

    return vertex;
  }

  render(prefix = '') {
    const { length, scale: { xAxis, lines } } = this.model.data;

    lines.forEach((line, lineIndex) => {
      xAxis.forEach((x, index) => {
        const y = line[index];
        const key = `${prefix}${lineIndex}_${index}`;

        this.container.appendChild(this.getVertex({
          x,
          y,
          key
        }));

        if (index <= length - 2) {
          this.container.appendChild(this.getLine({
            x1: x,
            y1: y,
            x2: xAxis[index + 1],
            y2: line[index + 1],
            key
          }));
        }
      });
    });

    if (this.brush) {
      this.renderBrush();
    }
  }

  renderBrush() {
    this.brush.render(Object.keys(this.lines).map(key => this.lines[key].cloneNode(false)));
  }

  /**
   * @public
   */
  attach(node) {
    node.appendChild(this.root);

    if (this.brush) {
      this.brush.attach(node);
    }

    return this;
  }
}
