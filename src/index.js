import SvgChart from './svg-chart';

import chartData from './chart_data';

export default class App {
  constructor() {
    this.charts = chartData.map(chart =>
      (new SvgChart()).prepareData(chart));
  }
}
