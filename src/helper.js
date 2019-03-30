import { DAYS_OF_WEEK, MONTHS } from './constants';

export const fieldExtractor = (data) => Object.keys(data.types);

export const colorExtractor = (data, field) => data.colors[field];

export const nameExtractor = (data, field) => data.names[field];

export const typeExtractor = (data, field) => data.types[field];

export const isNumber = value => typeof value === 'number';

export const isObject = value => typeof value === 'object';

export const createSvgElement = tagName => document.createElementNS('http://www.w3.org/2000/svg', tagName);

export const createElement = tagName => document.createElement(tagName);

export const tooltipXAxisDataFormatter = (value) => {
  const date = new Date(value);
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  const month = MONTHS[date.getMonth()];

  return `${dayOfWeek}, ${month} ${date.getDate()}`;
};

export const xAxisDataFormatter = (value) => {
  const date = new Date(value);
  const month = MONTHS[date.getMonth()];

  return `${month} ${date.getDate()}`;
};

export const dataExtractor = (data, field) =>
  (data.columns.find(([columnField]) =>
    columnField === field) || []).slice(1);

export const isUndefined = value => value === undefined;

export const filterEmpty = object => Object.keys(object)
  .reduce((acc, key) => isUndefined(object[key]) ?
    acc : Object.assign(acc, { [key]: object[key] }), {});

export const max = arr => Math.max(...arr);

export function throttle(func, wait, options) {
  let leading = true;
  let trailing = true;

  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  return debounce(func, wait, {
    leading,
    trailing,
    'maxWait': wait
  });
}

export function debounce(func, wait = 0, options) {
  let lastArgs;
  let lastThis;
  let maxWait;
  let result;
  let timerId;
  let lastCallTime;

  let lastInvokeTime = 0;
  let leading = false;
  let maxing = false;
  let trailing = true;

  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);

    return result;
  }

  function startTimer(pendingFunc, wait) {
    return setTimeout(pendingFunc, wait);
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, wait);

    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = undefined;

    return result;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }

      if (maxing) {
        timerId = startTimer(timerExpired, wait);

        return invokeFunc(lastCallTime);
      }
    }

    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait);
    }

    return result;
  }

  return debounced;
}

export function classNames () {
  const classes = [];
  const hasOwn = {}.hasOwnProperty;

  for (let i = 0; i < arguments.length; i++) {
    const arg = arguments[i];

    if (!arg) continue;

    const argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(this && this[arg] || arg);
    } else if (Array.isArray(arg)) {
      classes.push(classNames.apply(this, arg));
    } else if (argType === 'object') {
      for (let key in arg) {
        if (hasOwn.call(arg, key) && arg[key]) {
          classes.push(this && this[key] || key);
        }
      }
    }
  }

  return classes.join(' ');
}
