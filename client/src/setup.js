import "@testing-library/jest-dom";

// Mock ResizeObserver which is not implemented in jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
