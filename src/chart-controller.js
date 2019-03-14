import { TYPES } from './constants';

import {
  fieldExtractor,
  colorExtractor,
  nameExtractor,
  typeExtractor,
  dataExtractor,
  max,
  filterEmpty
} from 'helper';

export default class ChartController {
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
    this.options = Object.assign({}, ChartController.DEFAULT_OPTIONS, options);
    this.cache = {};
  }

  /**
   * @public
   */
  prepareData(data) {
    const fields = this.options.fieldExtractor(data);
    const types = fields.map(field => this.options.typeExtractor(data, field));
    const lines = fields.filter((field, index) => this.isLine(types[index]));
    const xAxisField = fields.find((field, index) => this.isXAxis(types[index]));
    const xAxis = this.options.dataExtractor(data, xAxisField);

    this.data = {
      xAxis,
      length: xAxis.length,
      lines: lines.map(field => this.extractLine(data, field)),
    };

    return this;
  }

  /**
   * @public
   */
  scale(start = 0, end = this.data.length) {
    const lines = this.data.lines.filter(({ visible }) => visible);
    const visibleFields = lines.map(({ field }) => field);
    const cacheKey = `${start}_${end}_${this.options.height}_${visibleFields.join('_')}`;

    if (!this.cache[cacheKey]) {
      const xAxis = this.data.xAxis.slice(start, end);
      const parsedLines = lines.map(({ values, field }) => {
        const newValues = values.slice(start, end);

        return {
          field,
          values: newValues,
          max: max(newValues)
        };
      });
      const allLinesMax = max(parsedLines.map(line => line.max));

      this.cache[cacheKey] = {
        start,
        end,
        xAxis,
        length: xAxis.length,
        lines: parsedLines.reduce((acc, { field, values }) =>
          Object.assign(acc, { [field]: this.scaleLine(values, allLinesMax) }), {})
      };
    }

    this.data.scale = this.cache[cacheKey];

    return this;
  }

  /**
   * @public
   * TODO
   */
  updateLine() {
    return this;
  }

  /**
   * @public
   */
  updateOptions(options = {}) {
    Object.assign(this.options, filterEmpty(options));

    return this;
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

    return {
      values,
      color,
      name,
      field,
      visible: true,
    };
  }

  // TODO: Optimize
  scaleLine(values, maxValue) {
    return values.map(value => this.options.height * value / maxValue);
  }
}
