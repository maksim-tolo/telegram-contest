import ChartModel from './chart-model';
import Brush from './brush';
import Checkbox from './checkbox';

export default class SvgChart {
  static get DEFAULT_OPTIONS() {
    return {
      defaultLineColor: '#000',
      defaultLineName: '',
      withBrush: true,
      linesToggleable: true,
      brushHeight: 128,
      width: 1024,
      height: 512
    };
  }

  constructor(data, options = {}) {
    // this.vertexes = {};
    this.lines = [];
    this.allLinesHidden = false;
    this.options = Object.assign({}, SvgChart.DEFAULT_OPTIONS, options);
    this.model = new ChartModel(this.options);
    this.model.prepareData(data).scale();
    this.allLinesHidden = this.isAllLinesHidden();

    this.scale = this.scale.bind(this);

    this.initDom();
    this.setSize();
    this.initBrush();
    this.initCheckbox();
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

      this.container.style.transition = 'transform .2s'; // TODO: Move to class

      this.root.appendChild(this.container);
    }
  }

  setSize() {
    if (!this.allLinesHidden) {
      const { scaleX, scaleY, dx, dy } = this.model.data.transform;
      const { width, height, withBrush, brushHeight } = this.options;
      const paddingBottom = withBrush ? brushHeight : 0;

      this.container.setAttribute('transform', `scale(${scaleX}, ${scaleY}) translate(${dx}, ${dy})`);
      this.root.setAttribute('viewBox', `0 0 ${width} ${height + paddingBottom}`);
      this.root.setAttribute('width', width);
      this.root.setAttribute('height', height + paddingBottom);
    }
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

  initCheckbox() {
    const { linesToggleable } = this.options;

    if (linesToggleable) {
      this.checkboxes = this.model.data.lines
        .map(({ color, name }, index) => new Checkbox({
          color,
          label: name,
          onChange: this.toggleLineVisibility.bind(this, index)
        }));
    }
  }

  toggleLineVisibility(lineIndex, event) {
    const {
      start,
      end,
    } = this.model.data.transform;
    const visible = event.target.checked;

    this.model.updateLine(lineIndex, { visible });
    this.model.transform(start, end);
    this.allLinesHidden = this.isAllLinesHidden();

    if (visible) {
      this.lines[lineIndex].setAttribute('stroke-width', 2);
    } else {
      this.lines[lineIndex].setAttribute('stroke-width', 0);
    }

    this.setSize();

    if (this.brush) {
      this.brush.toggleLineVisibility(lineIndex, visible);
    }
  }

  isAllLinesHidden() {
    return !this.model.data.lines.find(({ visible }) => visible);
  }

  /**
   * @public
   */
  resize({ width, height }) {
    this.model.updateOptions({ width, height });
    // this.transform();
    this.initDom();
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

  renderLine({ line, xAxis, color = '#000'}) {
    const d = line.reduce((acc, y, index) => {
      const vertex = `${xAxis[index]} ${this.options.height - y}`;

      if (index === 0) {
        return `M ${vertex}`;
      }

      return `${acc} L ${vertex}`;
    }, '');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    path.setAttribute('stroke', color);
    path.setAttribute('d', d);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');

    return path;
  }

  render() {
    const { scale: { xAxis, lines } } = this.model.data;

    this.lines = lines.map((line, lineIndex) => {
      const { color } = this.model.data.lines[lineIndex]; // TODO: fix

      return this.renderLine({
        line,
        xAxis,
        color
      });
    });

    this.lines.forEach(line => this.container.appendChild(line));
  }

  /**
   * @public
   */
  attach(node) {
    this.render();

    node.appendChild(this.root);

    if (this.brush) {
      this.brush.attach(this.root, this.lines.map(line => line.cloneNode(false)));
    }

    if (this.checkboxes) {
      this.checkboxes.forEach(checkbox => checkbox.attach(node));
    }
  }
}
