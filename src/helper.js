export const fieldExtractor = (data) => Object.keys(data.types);

export const colorExtractor = (data, field) => data.colors[field];

export const nameExtractor = (data, field) => data.names[field];

export const typeExtractor = (data, field) => data.types[field];

export const dataExtractor = (data, field) =>
  (data.columns.find(([columnField]) =>
    columnField === field) || []).slice(1);

export const isUndefined = value => value === undefined;

export const filterEmpty = object => Object.keys(object)
  .reduce((acc, key) => isUndefined(object[key]) ?
    acc : Object.assign(acc, { [key]: object[key] }), {});

export const max = arr => Math.max(...arr);

export function debounce(func, wait, immediate) {
  let timeout;

  return function debounced(...args) {
    const callNow = immediate && !timeout;

    const later = () => {
      timeout = null;

      if (!immediate) {
        func.apply(this, args);
      }
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(this, args);
    }
  };
}
