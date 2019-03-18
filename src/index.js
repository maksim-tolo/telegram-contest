import SvgChart from './svg-chart';

import chartData from './chart_data';

const root = document.getElementById('root');

const charts = chartData.map(chart =>
  (new SvgChart(chart)).attach(root).render());
