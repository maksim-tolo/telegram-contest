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

  // TODO: Rename
  init(data) {
    const fields = this.options.fieldExtractor(data);
    const types = fields.map(field => this.options.typeExtractor(data, field));
    const lines = fields.filter((field, index) => this.isLine(types[index]));
    const xAxis = fields.find((field, index) => this.isXAxis(types[index]));

    this.data = {
      lines: lines.map(field => this.extractLine(data, field)),
      xAxis: this.options.dataExtractor(data, xAxis)
    };
  }

  extractLine(data, field) {
    const values = this.options.dataExtractor(data, field);
    const color = this.options.colorExtractor(data, field) || this.options.defaultLineColor;
    const name = this.options.nameExtractor(data, field) || this.options.defaultLineName;
    const [min, max] = extent(values);

    return {
      values,
      min,
      max,
      color,
      name,
      dataField: field,
    };
  }

  isLine(type) {
    return type === this.options.lineType;
  }

  isXAxis(type) {
    return type === this.options.lineType;
  }

  // TODO: Optimize
  scaleLine(data, start, end) {
    const diff = data.max - data.min;
  }

  scaleYAxis(start, end) {

  }

  render() {

  }
}
