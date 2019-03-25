import SvgChart from './svg-chart';

import chartData from './chart-data';

import './index.css';

const darkModeKey = 'darkMode';

function isDarkMode() {
  if (localStorage) {
    const value = localStorage.getItem(darkModeKey);

    if (value) {
      return JSON.parse(value);
    }
  }

  return false;
}

function saveTheme(isDark) {
  if (localStorage) {
    localStorage.setItem(darkModeKey, isDark);
  }
}

function toggleMod(isDark, nightModeSwitcher) {
  if (isDark) {
    document.body.className = 'darkMode';
    nightModeSwitcher.textContent = 'Switch to Day Mode';
  } else {
    document.body.className = '';
    nightModeSwitcher.textContent = 'Switch to Night Mode';
  }
}

function initNightModeSwitcher() {
  const nightModeSwitcher = document.createElement('div');

  nightModeSwitcher.className = 'nightModeSwitcher';

  let isDark = isDarkMode();

  toggleMod(isDark, nightModeSwitcher);

  nightModeSwitcher.addEventListener('click', () => {
    isDark = !isDark;

    toggleMod(isDark, nightModeSwitcher);
    saveTheme(isDark);
  });

  return nightModeSwitcher;
}

function init() {
  const root = document.getElementById('root');
  const title = document.createElement('div');
  const nightModeSwitcher = initNightModeSwitcher();

  const width = Math.min(root.scrollWidth, 1024);

  title.textContent = 'Followers';
  title.className = 'title';

  root.appendChild(title);

  chartData.forEach((data) => {
    const chart = new SvgChart(data, {
      width,
      brushHeight: 64,
      height: 512
    });

    chart.attach(root);
  });

  root.appendChild(nightModeSwitcher);
}

window.addEventListener('load', init);
