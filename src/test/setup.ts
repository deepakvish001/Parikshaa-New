import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom implements neither of these; components that scroll call them freely and
// would otherwise log "Error: Not implemented" or throw "is not a function".
// Tests that care about scrolling spy on these directly.
Object.defineProperty(window, "scrollTo", { writable: true, value: () => {} });
Object.defineProperty(Element.prototype, "scrollIntoView", {
  writable: true,
  configurable: true,
  value: () => {},
});
