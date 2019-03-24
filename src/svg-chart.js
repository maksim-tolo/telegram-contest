import ChartModel from './chart-model';
import Brush from './brush';
import Checkbox from './checkbox';

import { debounce } from './helper';

export default class SvgChart {
  static get DEFAULT_OPTIONS() {
    return {
      defaultLineColor: '#000',
      defaultLineName: '',
      withBrush: true,
      linesToggleable: true,
      brushHeight: 128,
      width: 1024,
      height: 512,
      horizontalStrokesAmount: 5,
      brushOffset: 50,
      yAxisValuesPadding: 5,
      YAxisValuesAnimationDuration: 200
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
    // this.updateYAxisValues = debounce(this.updateYAxisValues.bind(this), this.options.YAxisValuesAnimationDuration);

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
    if (!this.svg) {
      const { YAxisValuesAnimationDuration } = this.options;

      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.horizontalStrokesContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.yAxisValuesContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.root = document.createElement('div');
      this.checkboxesContainer = document.createElement('div');

      this.checkboxesContainer.className = 'checkboxesContainer';
      this.horizontalStrokesContainer.style.animationDuration = `${YAxisValuesAnimationDuration}ms`;
      this.yAxisValuesContainer.style.animationDuration = `${YAxisValuesAnimationDuration}ms`;

      this.container.style.transition = 'transform .2s'; // TODO: Move to class

      this.svg.appendChild(this.horizontalStrokesContainer);
      this.svg.appendChild(this.container);
      this.svg.appendChild(this.yAxisValuesContainer);
      this.root.appendChild(this.svg);
      this.root.appendChild(this.checkboxesContainer);
    }
  }

  setSize() {
    if (!this.allLinesHidden) {
      const { scaleX, scaleY, dx, dy } = this.model.data.transform;
      const { width, height, withBrush, brushHeight, brushOffset } = this.options;
      const paddingBottom = withBrush ? brushHeight + brushOffset : 0;

      this.container.setAttribute('transform', `scale(${scaleX}, ${scaleY}) translate(${dx}, ${dy})`);
      this.svg.setAttribute('viewBox', `0 0 ${width} ${height + paddingBottom}`);
      this.svg.setAttribute('width', width);
      this.svg.setAttribute('height', height + paddingBottom);
    }

    this.updateYAxisValues();
  }

  initBrush() {
    const { width, height, brushHeight, withBrush, brushOffset } = this.options;
    const { yMax, edges } = this.model.data;

    if (withBrush) {
      this.brush = new Brush({
        width,
        height,
        brushHeight,
        yMax,
        edges,
        brushOffset,
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

    path.style.transition = 'stroke-width .1s'; // TODO: Move to class

    return path;
  }

  renderHorizontalStrokes() {
    const {
      horizontalStrokesAmount,
      height,
      width,
      yAxisValuesPadding
    } = this.options;

    if (horizontalStrokesAmount) {
      const diff = height / (horizontalStrokesAmount + 1);

      for (let i = 0; i <= horizontalStrokesAmount; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const y = height - (diff * i);

        line.setAttribute('stroke', '#e4eaef');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width);
        line.setAttribute('y2', y);
        line.setAttribute('stroke-width', '1');

        text.setAttribute('transform', `translate(${yAxisValuesPadding}, ${y - yAxisValuesPadding})`);
        text.setAttribute('class', 'yAxisValue');

        if (i === 0) {
          text.textContent = '0';
          this.svg.appendChild(line);
          this.svg.appendChild(text);
        } else {
          this.horizontalStrokesContainer.appendChild(line);
          this.yAxisValuesContainer.appendChild(text);
        }
      }
    }

    this.updateYAxisValues();
  }

  updateYAxisValues() {
    this.animateYAxisValues();
    this.setYAxisValues();
  }

  animateYAxisValues() {
    const { YAxisValuesAnimationDuration } = this.options;
    const { scaleY } = this.model.data.transform;

    const prevYAxisValuesContainer = this.yAxisValuesContainer;
    const prevHorizontalStrokesContainer = this.horizontalStrokesContainer;

    if (this.prevScaleY && this.prevScaleY !== scaleY) {
      setTimeout(() => {
        this.svg.removeChild(prevYAxisValuesContainer);
        this.svg.removeChild(prevHorizontalStrokesContainer);
        this.yAxisValuesContainer.setAttribute('class', '');
        this.horizontalStrokesContainer.setAttribute('class', '');
      }, YAxisValuesAnimationDuration);

      this.yAxisValuesContainer = this.yAxisValuesContainer.cloneNode(true);
      this.horizontalStrokesContainer = this.horizontalStrokesContainer.cloneNode(true);

      const yAxisValuesContainerClass = this.prevScaleY > scaleY ? 'fadeInDown' : 'fadeInUp';

      this.yAxisValuesContainer.setAttribute('class', yAxisValuesContainerClass);
      this.horizontalStrokesContainer.setAttribute('class', yAxisValuesContainerClass);

      const prevYAxisValuesContainerClass = this.prevScaleY > scaleY ? 'fadeOutDown' : 'fadeOutUp';
      
      prevYAxisValuesContainer.setAttribute('class', prevYAxisValuesContainerClass);
      prevHorizontalStrokesContainer.setAttribute('class', prevYAxisValuesContainerClass);

      this.svg.appendChild(this.yAxisValuesContainer);
      this.svg.insertBefore(this.horizontalStrokesContainer, this.container);
    }

    this.prevScaleY = scaleY;
  }

  setYAxisValues() {
    const { horizontalStrokesAmount } = this.options;
    const { yMax, transform: { scaleY } } = this.model.data;
    const step = (yMax / scaleY) / (horizontalStrokesAmount + 1);
    const children = this.yAxisValuesContainer.children;

    for (let i = 0; i < horizontalStrokesAmount; i++) {
      const child = children[i];

      if (child) {
        child.textContent = Math.round(step * (i + 1));
      }
    }
  }

  render() {
    const { scale: { xAxis, lines } } = this.model.data;

    this.renderHorizontalStrokes();

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
      this.brush.attach(this.svg, this.lines.map(line => line.cloneNode(false)));
    }

    if (this.checkboxes) {
      this.checkboxes.forEach(checkbox => checkbox.attach(this.checkboxesContainer));
    }
  }
}
