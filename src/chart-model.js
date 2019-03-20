import { TYPES } from './constants';

import {
  fieldExtractor,
  colorExtractor,
  nameExtractor,
  typeExtractor,
  dataExtractor,
  max,
  filterEmpty
} from './helper';

// TODO: Move all view-related logic
// Clear cache when update the data
export default class ChartModel {
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
    this.options = Object.assign({}, ChartModel.DEFAULT_OPTIONS, options);
    this.cache = {};
  }

  /**
   * @public
   */
  prepareData(data) {
    const fields = this.options.fieldExtractor(data);
    const types = fields.map(field => this.options.typeExtractor(data, field));
    const linesFields = fields.filter((field, index) => this.isLine(types[index]));
    const xAxisField = fields.find((field, index) => this.isXAxis(types[index]));
    const xAxis = this.options.dataExtractor(data, xAxisField);
    const lines = linesFields.map(field => this.extractLine(data, field));

    this.data = {
      lines,
      xAxis,
      length: xAxis.length,
      yMax: max(lines.map(({ maxValue }) => maxValue)),
      transform: { scaleX: 1, scaleY: 1, dx: 0, dy: 0 }
    };

    this.cache = {};

    return this;
  }

  /**
   * @public
   */
  scale() {
    const lines = this.scaleY();
    const xAxis = this.scaleX();

    this.data.scale = {
      lines,
      xAxis,
    };

    return this;
  }

  /**
   * @public
   */
  transform(start = 0, end = this.data.length) {
    this.data.transform = Object.assign({}, this.transformX(start, end), this.transformY(start, end));

    return this;
  }

  /**
   * @public
   * TODO: Update line props
   */
  updateLine() {
    return this;
  }

  /**
   * @public
   */
  updateOptions(options = {}) {
    this.options = Object.assign({}, this.options, filterEmpty(options));

    return this;
  }

  scaleX() {
    const { length } = this.data;
    const density = this.options.width / length;

    return Array.from({ length }, (v, k) => k * density);
  }

  scaleY() {
    return this.data.lines.map(({ field, values }) => this.scaleLine(values, this.data.yMax));
  }

  transformX(start, end) {
    const { length } = this.data;
    const { width } = this.options;
    const newLength = end - start;
    const cacheKey = `transformX_${newLength}_${width}`;

    if (!this.cache[cacheKey]) {

      const scaleX = length / newLength;
      const dx = - ((width / length) * start);

      this.cache[cacheKey] = {
        scaleX,
        dx
      };
    }

    return this.cache[cacheKey];
  }

  transformY(start, end) {
    const { height } = this.options;
    const lines = this.data.lines.filter(({ visible }) => visible); // TODO: Visible is representational property
    const visibleFields = lines.map(({ field }) => field);
    const cacheKey = `transformY_${start}_${end}_${this.options.height}_${visibleFields.join('_')}`;

    if (!this.cache[cacheKey]) {
      const linesMax = max(lines.map(({ values }) =>
        max(values.slice(start, end))));

      const scaleY = this.data.yMax / linesMax;
      const dy = height / scaleY - height;

      this.cache[cacheKey] = {
        scaleY,
        dy
      };
    }

    return this.cache[cacheKey];
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
    const maxValue = max(values);

    return {
      values,
      color,
      name,
      field,
      maxValue,
      visible: true,
    };
  }

  scaleLine(values, maxValue) {
    return values.map(value => this.options.height * value / maxValue);
  }
}
