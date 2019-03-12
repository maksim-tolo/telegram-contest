import { TYPES } from './constants';

import {
  fieldExtractor,
  colorExtractor,
  nameExtractor,
  typeExtractor,
  dataExtractor,
  extent
} from 'helper';

export default class Drawer {
  static get DEFAULT_OPTIONS() {
    return {
      width: 500,
      height: 500,
      lineType: TYPES.LINE,
      xAxisType: TYPES.X_AXIS,
      defaultLineColor: '#000',
      defaultLineName: '',
      fieldExtractor,
      colorExtractor,
      nameExtractor,
      typeExtractor,
      dataExtractor
    };
  }

  constructor(options = {}) {
    this.options = Object.assign({}, Drawer.DEFAULT_OPTIONS, options);
  }

  /**
   * @public
   * @param data
   * @returns {Drawer}
   */
  prepareData(data) {
    const fields = this.options.fieldExtractor(data);
    const types = fields.map(field => this.options.typeExtractor(data, field));
    const lines = fields.filter((field, index) => this.isLine(types[index]));
    const xAxis = fields.find((field, index) => this.isXAxis(types[index]));

    this.data = {
      lines: lines.map(field => this.extractLine(data, field)),
      xAxis: this.options.dataExtractor(data, xAxis)
    };

    return this;
  }

  /**
   * @public
   */
  render() {

  }

  isLine(type) {
    return type === this.options.lineType;
  }

  isXAxis(type) {
    return type === this.options.lineType;
  }

  extractLine(data, field) {
    const values = this.options.dataExtractor(data, field);
    const color = this.options.colorExtractor(data, field) || this.options.defaultLineColor;
    const name = this.options.nameExtractor(data, field) || this.options.defaultLineName;
    const [min, max] = extent(values);
    const scaled = this.scaleLine(values, max - min);

    return {
      values,
      min,
      max,
      color,
      name,
      scaled,
      dataField: field,
    };
  }

  // TODO: Optimize
  scaleLine(values, diff) {
    return values.map(value => this.options.width * value / diff);
  }

  createLine(x1, y1, x2, y2, color) {
    const newLine = document.createElementNS('http://www.w3.org/2000/svg','line');

    newLine.setAttribute('x1', x1);
    newLine.setAttribute('y1', y1);
    newLine.setAttribute('x2', x2);
    newLine.setAttribute('y2', y2);
    newLine.setAttribute('stroke', color);

    return newLine;
  }
}
