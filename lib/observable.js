/**
 * Observable API module
 * @module @lumjs/core/observable
 */
"use strict";

const {B,S,def} = require('./types');
const orig = require('./old/observable');
const evob = require('./events/observable');

/**
 * Make a target object (or function) support the observable API.
 * 
 * There are currently two implementations of the observable API,
 * and this function will determine which one to call based on the
 * arguments passed (if old options or positional arguments are
 * detected, the original implementation will be called, otherwise
 * the new events-based implementation will be called.)
 * 
 * When the older implementation is removed, this function will be
 * replaced by a simple alias to `makeObservable`.
 * 
 * NOTE: this function is the *actual* exported value of the `observable`
 * module, but it's also available as `observable.auto` and that is how
 * it's being documented (as jsdoc doesn't like functions being treated
 * like objects with methods defined on them, but I do that a lot.)
 * 
 * @param {(object|function)} el - The target to add observable API to.
 * @param {object} [opts] Options that define behaviours.
 * 
 * If the `addre` and `reinherit` options are detected, then the original
 * implementation will be used.
 * 
 * @param {string} [opts.wildcard='*'] The event name used as a wildcard. 
 * 
 * @param {boolean} [opts.wrapargs=false] If `true`, the event handlers will 
 * be passed a wrapper object as the sole argument:
 * 
 * ```js
 * { 
 *   isObservable:
 *   { // Immutable;
 *     event: true,   // This is an event data object.
 *     target: false, // This is not the target object.
 *   },
 *   wildcard: bool,  // Will be true if this was a wildcard event handler.
 *   func: function,  // The function being called.
 *   args: array,     // The arguments passed to trigger.
 *   self: el,        // The target object.
 *   name: event,     // The event name that was triggered.
 *   target: el,      // An alias to `self`.
 *   type: event,     // An alias to `name`.
 *   // ...
 * }
 * ```
 * 
 * @param {boolean} [opts.wrapthis=false] If `true`, `this` in event 
 * handlers will be the same object as `opts.wrapargs`.
 * 
 * @param {?function} [opts.wrapsetup=null] Setup function for wrapper data.
 * 
 * This function will be called with the target `el` as `this`,
 * and will be passed the wrapper object (before it is locked),
 * so it can examine the event name and arguments passed to
 * `trigger()` and adjust the object accordingly.
 * 
 * This allows the wrapper objects to have a lot more custom properties,
 * and feel more like the standard Event objects used by the `DOM`.
 * 
 * If this is specified, but neither `opts.wrapargs` or `opts.wrapthis` 
 * is `true`, then `opts.wrapargs` will be changed to `true` implicitly.
 * 
 * @param {boolean} [opts.wraplock=true] If `true`, the wrapper object
 * will be made immutable using the `Object.freeze()` method.
 * 
 * @param {boolean} [opts.addname] If `true` callbacks with 
 * multiple events will have the name of the triggered event added as
 * the first parameter.
 * 
 * If either `wrapthis` or `wrapargs` are `true`, then this will default
 * to `false`, otherwise it will default to `true`.
 * 
 * @param {boolean} [opts.addis] If `true` add a read-only, frozen
 * object property named `isObservable` with the value:
 * 
 * ```js
 * {
 *   event: false, // This is not an event data object.
 *   target: true, // This is the target object.
 * }
 * ```
 *
 * If either `wrapthis` or `wrapargs` are `true`, then this will default
 * to `true`, otherwise it will default to `false`.
 * 
 * @param {string} [opts.addme] If set, add a method with this name
 * to the `el` object, which is a version of `observable()` with the
 * default options being the same as the current `opts`.
 * 
 * @param {(boolean|object)} [arg3] Version dependent argument.
 * 
 * If this is a `boolean` then the original observable implementation
 * will be called and this will be the `redefine` argument.
 * 
 * Otherwise it's assumed to be the `ro` argument of the `makeObservable`
 * compatibility implementation.
 * 
 * @returns {object} el
 * 
 * @see module:@lumjs/core/observable.orig
 * @see module:@lumjs/core/events/observable.makeObservable
 * @alias module:@lumjs/core/observable.auto
 */
function observable (el={}, opts={}, arg3) 
{
  if (typeof arg3 === B 
    || typeof opts.addre === S 
    || typeof opts.reinherit === B)
  { 
    return orig(el, opts, arg3);
  }
  else
  {
    return evob.makeObservable(el, opts, arg3);
  }
}

module.exports = observable;

def(observable)
  ('is', evob.isObservable)
  ('auto', observable)
  ('orig', orig)
  ('wrap', evob.makeObservable)

/**
 * Does a value implement the observable interface?
 * @function module:@lumjs/core/observable.is
 * @param {*} v - Value to test
 * @returns {boolean}
 * @see module:@lumjs/core/events/observable.isObservable
 */

/**
 * An alias to
 * {@link module:@lumjs/core/events/observable.makeObservable makeObservable()}
 * 
 * @function module:@lumjs/core/observable.wrap
 * @param {(object|function)} el
 * @param {object} oo
 * @param {object} ro
 * @returns {object}
 */
