export const fieldExtractor = (data) => Object.keys(data.types);

export const colorExtractor = (data, field) => data.colors[field];

export const nameExtractor = (data, field) => data.names[field];

export const typeExtractor = (data, field) => data.types[field];

export const dataExtractor = (data, field) =>
  (data.columns.find(([columnField]) =>
    columnField === field) || []).slice(1);

export const max = arr => Math.max(arr);

export const min = arr => Math.min(arr);

export const extent = arr => [min(arr), max(arr)];
