import SvgChart from './svg-chart';
import NightModeSwitcher from './night-mode-switcher';

import chartData from './chart-data';

import './index.css';

const toggleDarkMode = isDarkMode =>
  document.body.className = isDarkMode ? 'darkMode' : '';

function init() {
  const nightModeSwitcher = new NightModeSwitcher({ onToggle: toggleDarkMode });
  const root = document.getElementById('root');
  const title = document.createElement('div');

  title.textContent = 'Followers';
  title.className = 'title';

  root.appendChild(title);

  chartData.forEach((data) => {
    const chart = new SvgChart(data, {
      width: Math.min(root.scrollWidth, 1024),
      brushHeight: 64,
      height: 512
    });

    chart.attach(root);
  });

  nightModeSwitcher.attach(root);
}

window.addEventListener('load', init);
