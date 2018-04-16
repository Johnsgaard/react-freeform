export const getDisplayName =
  component => component.displayName || component.name || 'Component';

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export const debounce = (func, wait, immediate) => {
  let timeout;
  return () => {
    const context = this;
    const args = arguments;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

export const noop = /* istanbul ignore next */ () => {};

export const fakeChangeEvent = (name, value) => ({
  preventDefault: noop,
  target: { name, value },
});

export const shallowCompare = (nextObj, currObj) => {
  const keysNext = Object.keys(nextObj);
  const keysCurr = Object.keys(currObj);
  return (keysNext.length !== keysCurr.length) ||
    keysNext.some(next => (nextObj[next] !== currObj[next]));
};
