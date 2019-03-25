import SvgChart from './svg-chart';

import chartData from './chart-data';

import './index.css';

const darkModeKey = 'darkMode';

function isDarkMode() {
  return localStorage && localStorage.getItem(darkModeKey);
}

function init() {
  const root = document.getElementById('root');
  const title = document.createElement('div');

  title.textContent = 'Followers';
  title.className = 'title';

  root.appendChild(title);

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
