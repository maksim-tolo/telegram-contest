import ChartModel from '../chart-model';
import Brush from '../brush';
import Checkbox from '../checkbox';
import Tooltip from '../tooltip';
import XAxis from '../x-axis';

import {
  throttle,
  tooltipXAxisDataFormatter,
  xAxisDataFormatter,
  classNames,
  createSvgElement,
  createElement
} from '../helper';

import styles from './index.module.css';

const cx = classNames.bind(styles);

export default class SvgChart {
  static get DEFAULT_OPTIONS() {
    return {
      tooltipXAxisDataFormatter,
      xAxisDataFormatter,
      defaultLineColor: '#000',
      defaultLineName: '',
      withBrush: true,
      linesToggleable: true,
      withTooltip: true,
      withXAxis: true,
      withYAxis: true,
      brushHeight: 128,
      width: 1024,
      height: 512,
      horizontalStrokesAmount: 5,
      brushOffset: 50,
      yAxisValuesPadding: 5,
      xAxisValuesPadding: 20,
      yAxisValuesAnimationDuration: 200,
      xAxisValuesAnimationDuration: 200,
      animationDelay: 5,
      strokeWidth: 2,
      vertexRadius: 5,
      xAxisMaxTextWidth: 80,
      tooltipWidth: 140,
      tooltipOffset: 10
    };
  }

  constructor(data, options = {}) {
    this.lines = [];
    this.verticalStrokes = [];
    this.allLinesHidden = false;
    this.options = Object.assign({}, SvgChart.DEFAULT_OPTIONS, options);
    this.model = new ChartModel(this.options);
    this.model.prepareData(data).scale();
    this.step = this.options.width / this.model.data.length;
    this.allLinesHidden = this.isAllLinesHidden();

    const {
      animationDelay,
      yAxisValuesAnimationDuration,
      xAxisValuesAnimationDuration
    } = this.options;

    this.scale = this.scale.bind(this);
    this.showVerticalStroke = this.showVerticalStroke.bind(this);
    this.hideVerticalStrokesAndTooltip = this.hideVerticalStrokesAndTooltip.bind(this);
    this.updateYAxisValues = throttle(this.updateYAxisValues.bind(this), yAxisValuesAnimationDuration + animationDelay);
    this.updateXAxisValues = throttle(this.updateXAxisValues.bind(this), xAxisValuesAnimationDuration + animationDelay);

    this.initDom();
    this.setSize();
    this.initBrush();
    this.initCheckbox();
    this.initTooltip();
    this.initXAxis();
  }

  scale({ x, width }, { brushWidth }) {
    const { length } = this.model.data;
    const scaleStart = Math.round(x / brushWidth * length);
    const delta = Math.round(width / brushWidth * length);
    const scaleEnd = scaleStart + delta;

    if (scaleStart !== this.scaleStart || scaleEnd !== this.scaleEnd) {
      this.model.transform(scaleStart, scaleEnd);
      this.setSize();
      this.updateYAxisValues();
      this.updateXAxisValues();
      this.hideVerticalStrokesAndTooltip();
    }

    this.scaleStart = scaleStart;
    this.scaleEnd = scaleEnd;
  }

  // TODO: Add padding
  initDom() {
    if (!this.svg) {
      const { yAxisValuesAnimationDuration } = this.options;

      this.svg = createSvgElement('svg');
      this.horizontalStrokesContainer = createSvgElement('g');
      this.yAxisValuesContainer = createSvgElement('g');
      this.container = createSvgElement('g');
      this.vertexesContainer = createSvgElement('g');
      this.root = createElement('div');

      this.root.className = cx('rootContainer');
      this.container.setAttribute('class', cx('chartContainer'));
      this.horizontalStrokesContainer.style.animationDuration = `${yAxisValuesAnimationDuration}ms`;
      this.horizontalStrokesContainer.style['-webkit-animation-duration'] = `${yAxisValuesAnimationDuration}ms`;
      this.yAxisValuesContainer.style.animationDuration = `${yAxisValuesAnimationDuration}ms`;
      this.yAxisValuesContainer.style['-webkit-animation-duration'] = `${yAxisValuesAnimationDuration}ms`;

      this.svg.appendChild(this.horizontalStrokesContainer);
      this.svg.appendChild(this.container);
      this.svg.appendChild(this.yAxisValuesContainer);
      this.root.appendChild(this.svg);
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
        onMove: this.scale
      });
    }
  }

  initTooltip() {
    const {
      tooltipWidth,
      withTooltip,
      tooltipOffset
    } = this.options;

    if (withTooltip) {
      this.tooltip = new Tooltip({
        width: tooltipWidth,
        offset: tooltipOffset
      });
    }
  }

  initCheckbox() {
    const { linesToggleable } = this.options;

    if (linesToggleable) {
      this.checkboxesContainer = createElement('div');
      this.checkboxesContainer.className = cx('checkboxesContainer');

      this.root.appendChild(this.checkboxesContainer);

      this.checkboxes = this.model.data.lines
        .map(({ color, name }, index) => new Checkbox({
          color,
          label: name,
          onChange: this.toggleLineVisibility.bind(this, index)
        }));
    }
  }

  initXAxis() {
    const {
      withXAxis,
      width,
      height,
      xAxisMaxTextWidth,
      xAxisValuesAnimationDuration,
      xAxisDataFormatter,
      xAxisValuesPadding
    } = this.options;

    if (withXAxis) {
      this.xAxis = new XAxis(this.model.data.xAxis, {
        width,
        height,
        valuesAmount: Math.floor(width / xAxisMaxTextWidth),
        animationDuration: xAxisValuesAnimationDuration,
        dataFormatter: xAxisDataFormatter,
        padding: xAxisValuesPadding
      });
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
    this.lines[lineIndex].style.opacity = visible ? 1 : 0;

    this.setSize();
    this.updateYAxisValues();
    this.updateXAxisValues();

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

  showVertexes(parent) {
    const { scaleX, scaleY } = this.model.data.transform;
    const { vertexRadius, tooltipWidth, tooltipOffset } = this.options;
    const nodes = parent.children;
    const length = nodes.length;

    this.showedVertexes = [];

    const lines = [];
    let title = '';
    let lineX;

    for (let i = 0; i < length; i++) {
      const node = nodes[i];

      if (node.nodeName === 'ellipse') {
        const { lineIndex, value } = node.__data__;
        const line = this.model.data.lines[lineIndex];

        if (line.visible) {
          node.setAttribute('rx', vertexRadius / scaleX);
          node.setAttribute('ry', vertexRadius / scaleY);
          node.style.visibility = 'visible';

          this.showedVertexes.push(node);

          lines.push({
            value,
            title: line.name,
            color: line.color
          })
        }
      } else if (node.nodeName === 'line') {
        title = node.__data__.value;
        const rootRect = this.root.getBoundingClientRect();

        lineX= Math.min(rootRect.width - tooltipWidth - tooltipOffset, node.getBoundingClientRect().x - rootRect.x)
      }
    }

    if (this.tooltip) {
      this.updateTooltipContent(title, lines);
      this.tooltip.updatePosition({ x: lineX });
      this.tooltip.toggleVisibility(true);
    }
  }

  updateTooltipContent(title, lines) {
      const linesValues = lines.map(({ value, title, color }) => (`
      <div class="${cx('valueWrapper')}" style="color: ${color}">
        <div class="${cx('laneValue')}">${value}</div>
        <div class="${cx('lineName')}">${title}</div>
      </div>
    `)).join('');

      const content = `
      <div class="${cx('tooltipTitle')}">${this.options.tooltipXAxisDataFormatter(title)}</div>
      <div class="${cx('valuesContainer')}">${linesValues}</div>
    `;

      this.tooltip.updateContent(content);
  }

  hideVertexes() {
    if (this.showedVertexes) {
      this.showedVertexes.forEach((vertex) => {
        vertex.setAttribute('ry', '0');
        vertex.setAttribute('rx', '0');
        vertex.style.visibility = 'hidden';
      });

      this.showedVertexes = null;
    }
  }

  renderVerticalStrokes() {
    const { xAxis } = this.model.data;
    const { height } = this.options;

    let line;
    let g;

    xAxis.forEach((x, index) => {
      const xPosition = this.step * index;

      if (!line) {
        line = createSvgElement('line');
        line.setAttribute('stroke', 'transparent');
        line.setAttribute('y1', '0');
        line.setAttribute('stroke-width', this.step);
        line.setAttribute('y2', height);
      } else {
        line = line.cloneNode(false);
      }

      if (!g) {
        g = createSvgElement('g');
      } else {
        g = g.cloneNode(false);
      }

      line.setAttribute('x1', xPosition);
      line.setAttribute('x2', xPosition);

      line.__data__ = {
        value: x
      };

      g.appendChild(line);

      this.verticalStrokes.push(g);
      this.vertexesContainer.appendChild(g);
    })
  }

  renderVertexes({ line, xAxis, lineIndex, color = '#000' }) {
    const { strokeWidth, height } = this.options;
    const { lines } = this.model.data;

    let vertex;

    line.forEach((y, index) => {
      if (!vertex) {
        vertex = createSvgElement('ellipse');
        vertex.setAttribute('ry', '0');
        vertex.setAttribute('ry', '0');
        vertex.setAttribute('fill', 'currentColor');
        vertex.setAttribute('stroke-width', strokeWidth);
        vertex.setAttribute('vector-effect', 'non-scaling-stroke');
        vertex.setAttribute('stroke', color);
        vertex.setAttribute('class', cx('vertex'))
      } else {
        vertex = vertex.cloneNode(false);
      }

      vertex.setAttribute('cx', xAxis[index]);
      vertex.setAttribute('cy', height - y);

      vertex.__data__ = {
        lineIndex,
        value: lines[lineIndex].values[index]
      };

      const container = this.verticalStrokes[index];

      if (container) {
        container.appendChild(vertex);
      }
    });
  }

  renderLine({ line, xAxis, color = '#000'}) {
    const d = line.reduce((acc, y, index) => {
      const vertex = `${xAxis[index]} ${this.options.height - y}`;

      if (index === 0) {
        return `M ${vertex}`;
      }

      return `${acc} L ${vertex}`;
    }, '');

    const path = createSvgElement('path');

    path.setAttribute('stroke', color);
    path.setAttribute('d', d);
    path.setAttribute('class', cx('chartLine'));
    path.setAttribute('stroke-width', this.options.strokeWidth);

    return path;
  }

  renderHorizontalStrokes() {
    const {
      horizontalStrokesAmount,
      height,
      width,
      yAxisValuesPadding
    } = this.options;

    let line;
    let text;

    if (horizontalStrokesAmount) {
      const diff = height / (horizontalStrokesAmount + 1);

      for (let i = 0; i <= horizontalStrokesAmount; i++) {
        if (!line) {
          line = createSvgElement('line');
          line.setAttribute('stroke', '#9da2a780');
          line.setAttribute('x1', '0');
          line.setAttribute('stroke-width', '1');
          line.setAttribute('x2', width);
        } else {
          line = line.cloneNode(false);
        }

        if (!text) {
          text = createSvgElement('text');
          text.setAttribute('class', cx('yAxisValue'));
        } else {
          text = text.cloneNode(false);
        }

        const y = height - (diff * i);

        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        text.setAttribute('x', yAxisValuesPadding);
        text.setAttribute('y', y - yAxisValuesPadding);

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
  }

  updateYAxisValues() {
    if (!this.allLinesHidden) {
      this.animateYAxisValues();
      this.setYAxisValues();
    }
  }

  animateYAxisValues() {
    const { yAxisValuesAnimationDuration } = this.options;
    const { scaleY } = this.model.data.transform;

    const prevYAxisValuesContainer = this.yAxisValuesContainer;
    const prevHorizontalStrokesContainer = this.horizontalStrokesContainer;

    if (this.prevScaleY && this.prevScaleY !== scaleY) {
      setTimeout(() => {
        this.svg.removeChild(prevYAxisValuesContainer);
        this.svg.removeChild(prevHorizontalStrokesContainer);
        this.yAxisValuesContainer.setAttribute('class', '');
        this.horizontalStrokesContainer.setAttribute('class', '');
      }, yAxisValuesAnimationDuration);

      this.yAxisValuesContainer = this.yAxisValuesContainer.cloneNode(true);
      this.horizontalStrokesContainer = this.horizontalStrokesContainer.cloneNode(true);

      const yAxisValuesContainerClass = cx(this.prevScaleY > scaleY ? 'fadeInDown' : 'fadeInUp');

      this.yAxisValuesContainer.setAttribute('class', yAxisValuesContainerClass);
      this.horizontalStrokesContainer.setAttribute('class', yAxisValuesContainerClass);

      const prevYAxisValuesContainerClass = cx(this.prevScaleY > scaleY ? 'fadeOutDown' : 'fadeOutUp');

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

  updateXAxisValues() {
    if (this.xAxis && !this.allLinesHidden) {
      const { start, end } = this.model.data.transform;

      this.xAxis.updateValues(start, end);
    }
  }

  render() {
    const { scale: { xAxis, lines } } = this.model.data;

    this.renderHorizontalStrokes();
    this.renderVerticalStrokes();
    this.updateYAxisValues();

    this.lines = lines.map((line, lineIndex) => {
      const { color } = this.model.data.lines[lineIndex]; // TODO: fix

      this.renderVertexes({
        line,
        xAxis,
        color,
        lineIndex
      });

      return this.renderLine({
        line,
        xAxis,
        color
      });
    });

    this.lines.forEach(line => this.container.appendChild(line));
    this.container.appendChild(this.vertexesContainer);
  }

  showVerticalStroke(e) {
    const node = e.target;

    if (node.nodeName === 'line' && this.previusHoveredStroke !== node) {
      this.hideVerticalStroke();

      node.setAttribute('stroke', '#9da2a780');
      node.setAttribute('vector-effect', 'non-scaling-stroke');
      node.setAttribute('stroke-width', '1');
      this.previusHoveredStroke = node;

      this.showVertexes(node.parentNode);
    }
  }

  hideVerticalStroke() {
    if (this.previusHoveredStroke) {
      this.previusHoveredStroke.setAttribute('stroke', 'transparent');
      this.previusHoveredStroke.setAttribute('vector-effect', 'default');
      this.previusHoveredStroke.setAttribute('stroke-width', this.step);
      this.previusHoveredStroke = null;

      this.hideVertexes();
    }
  }

  hideVerticalStrokesAndTooltip(e) {
    if (e && this.tooltip && e.relatedTarget === this.tooltip.root) {
      return;
    }

    this.hideVerticalStroke();

    if (this.tooltip) {
      this.tooltip.toggleVisibility(false);
    }
  }

  // TODO: Add touch handlers
  addListeners() {
    this.vertexesContainer.addEventListener('mouseover', this.showVerticalStroke);
    // this.vertexesContainer.addEventListener('touchmove', this.showVerticalStroke);
    // this.vertexesContainer.addEventListener('touchstart', this.showVerticalStroke);
    this.svg.addEventListener('mouseleave', this.hideVerticalStrokesAndTooltip);
    // this.vertexesContainer.addEventListener('touchend', this.hideVerticalStrokesAndTooltip, true);
    // this.vertexesContainer.addEventListener('touchcancel', this.hideVerticalStrokesAndTooltip, true);
  }

  removeListeners() {
    this.vertexesContainer.removeEventListener('mouseover', this.showVerticalStroke);
    // this.vertexesContainer.removeEventListener('touchmove', this.showVerticalStroke);
    // this.vertexesContainer.removeEventListener('touchstart', this.showVerticalStroke);
    this.svg.removeEventListener('mouseleave', this.hideVerticalStrokesAndTooltip);
    // document.removeEventListener('touchend', this.hideVerticalStrokesAndTooltip);
  }

  attach(node) {
    this.render();

    node.appendChild(this.root);

    if (this.checkboxes) {
      this.checkboxes.forEach(checkbox => checkbox.attach(this.checkboxesContainer));
    }

    if (this.tooltip) {
      this.tooltip.attach(this.root);
    }

    if (this.xAxis) {
      this.xAxis.attach(this.svg);
      this.updateXAxisValues();
    }

    if (this.brush) {
      this.brush.attach(this.svg, this.lines.map(line => line.cloneNode(false)));
    }

    this.addListeners();
  }

  detach(node) {
    if (this.brush) {
      this.brush.detach(this.svg);
    }

    if (this.checkboxes) {
      this.checkboxes.forEach(checkbox => checkbox.detach(this.checkboxesContainer));
    }

    if (this.tooltip) {
      this.tooltip.detach(this.root);
    }

    if (this.xAxis) {
      this.xAxis.detach(this.svg);
    }

    node.removeChild(this.root);
    this.removeListeners();

    this.root = null;
  }
}
