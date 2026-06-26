'use strict';
/**
 * Polyfill globals that React Native's setUpDefaultReactNativeEnvironment
 * tries to define via class syntax with private fields (#field).
 *
 * babel-preset-expo transforms those classes with
 * @babel/plugin-transform-class-properties (loose:true), which emits the
 * class as an expression whose name binding is not in scope for the static
 * initializer code that follows each class body. Hermes then throws
 * "ReferenceError: Property 'X' doesn't exist".
 *
 * Installing minimal stubs on `global` BEFORE InitializeCore runs silences
 * the error. React Native's own setUpDOM / setUpPerformance will later
 * override these stubs with full implementations once those modules load.
 */

// ─── DOMException ────────────────────────────────────────────────────────────
if (typeof global.DOMException === 'undefined') {
  global.DOMException = (function () {
    function DOMException(message, name) {
      this.message = message || '';
      this.name = name || 'Error';
      this.stack = new Error(this.message).stack || '';
    }
    DOMException.prototype = Object.create(Error.prototype);
    DOMException.prototype.constructor = DOMException;
    return DOMException;
  })();
}

// ─── Performance API stubs ───────────────────────────────────────────────────
if (typeof global.PerformanceEntry === 'undefined') {
  global.PerformanceEntry = function PerformanceEntry() {};
}
if (typeof global.PerformanceMark === 'undefined') {
  global.PerformanceMark = function PerformanceMark() {};
}
if (typeof global.PerformanceMeasure === 'undefined') {
  global.PerformanceMeasure = function PerformanceMeasure() {};
}
if (typeof global.PerformanceObserver === 'undefined') {
  global.PerformanceObserver = function PerformanceObserver() {};
  global.PerformanceObserver.supportedEntryTypes = [];
}
if (typeof global.PerformanceObserverEntryList === 'undefined') {
  global.PerformanceObserverEntryList = function PerformanceObserverEntryList() {};
}
if (typeof global.PerformanceEventTiming === 'undefined') {
  global.PerformanceEventTiming = function PerformanceEventTiming() {};
}
if (typeof global.TaskAttributionTiming === 'undefined') {
  global.TaskAttributionTiming = function TaskAttributionTiming() {};
}
