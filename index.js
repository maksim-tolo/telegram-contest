import Drawer from './drawer';

import chartData from './chart_data';

export default class App {
  constructor() {
    this.charts = chartData.map(chart =>
      (new Drawer()).prepareData(chart));
  }
}
