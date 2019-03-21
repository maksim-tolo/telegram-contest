import ChartModel from './chart-model';
import Brush from './brush';

export default class SvgChart {
  static get DEFAULT_OPTIONS() {
    return {
      defaultLineColor: '#000',
      defaultLineName: '',
      withBrush: true,
      brushHeight: 128,
      width: 1024,
      height: 512
    };
  }

  constructor(data, options = {}) {
    this.vertexes = {};
    this.lines = {};
    this.options = Object.assign({}, SvgChart.DEFAULT_OPTIONS, options);
    this.model = new ChartModel(this.options);
    this.model.prepareData(data).scale();

    this.scale = this.scale.bind(this);

    this.initDom();
    this.setSize();
    this.initBrush();
  }

  scale({ x, width }, { brushWidth }) {
    const { length } = this.model.data;
    const scaleStart = Math.round(x / brushWidth * length);
    const scaleEnd = Math.round((x + width) / brushWidth * length);

    if (scaleStart !== this.scaleStart || scaleEnd !== this.scaleEnd) {
      this.model.transform(scaleStart, scaleEnd);
      this.setSize();
    }

    this.scaleStart = scaleStart;
    this.scaleEnd = scaleEnd;
  }

  // TODO: Add padding
  initDom() {
    if (!this.root) {
      this.root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      this.container.style.transition = 'transform .5s ease-out'; // TODO: Move to class

      this.root.appendChild(this.container);
    }
  }

  setSize() {
    const { scaleX, scaleY, dx, dy } = this.model.data.transform;
    const { width, height, withBrush, brushHeight } = this.options;
    const paddingBottom = withBrush ? brushHeight : 0;

    this.container.setAttribute('transform', `scale(${scaleX}, ${scaleY}) translate(${dx}, ${dy})`);
    this.root.setAttribute('viewBox', `0 0 ${width} ${height + paddingBottom}`);
    this.root.setAttribute('width', width);
    this.root.setAttribute('height', height + paddingBottom);
  }

  initBrush() {
    const { width, height, brushHeight, withBrush } = this.options;

    if (withBrush) {
      this.brush = new Brush({
        width,
        height,
        brushHeight,
        onMove: this.scale,
      });
    }
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
    this.initDom();
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
    line.setAttribute('y1', this.options.height - y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', this.options.height - y2);
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
    vertex.setAttribute('cy', this.options.height - y);
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
      this.brush.attach(this.root);
    }

    return this;
  }
}
