import SvgChart from './svg-chart';

import chartData from './chart-data';

import './index.css';

function init() {
  const root = document.getElementById('root');
  const width = Math.min(root.scrollWidth, 1024);

  chartData.forEach((data) => {
    const chart = new SvgChart(data, {
      width,
      brushHeight: 64,
      height: 512
    });

    chart.attach(root);
  });
}

window.addEventListener('load', init);
