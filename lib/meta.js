"use strict";

const {F} = require('./types/js');

/**
 * Get a stacktrace. Differs from browser to browser.
 *
 * Uses the `stack` property of an `Error` object as the source.
 * This is a super simplistic hack. For a more complete solution, try
 * the `stacktrace-js` library, which will be used in the new `@lumjs/debug`
 * library as a dependency.
 *
 * @param {string} [msg] - A message for the Error object.
 *
 * @returns {string[]} An array of stack strings.
 * @alias module:@lumjs/core.stacktrace
 */
function stacktrace(msg)
{
  return (new Error(msg)).stack.split("\n");
}

exports.stacktrace = stacktrace;

/**
 * An Error that can be thrown from abstract methods.
 * 
 * Example usage:
 * 
 * ```js
 * class MyAbstractClass
 * {
 *   abstractMethod()
 *   {
 *     throw new AbstractError();
 *     // msg = "Abstract method not implemented"
 *   }
 * 
 *   namedMethod()
 *   {
 *     throw new AbstractError("namedMethod");
 *     // msg = "Abstract method 'namedMethod' not implemented"
 *   }
 * 
 *   get absProp()
 *   {
 *     throw new AbstractError("absProp", true);
 *     // msg = "Abstract getter 'absProp' not implemented"
 *   }
 * }
 * ```
 * 
 * @alias module:@lumjs/core.AbstractError
 */
class AbstractError extends Error
{
  /**
   * Construct an AbstractError
   * 
   * @param {string} [name] Name of abstract method/getter.
   * 
   * If included will be included in error message.
   * 
   * @param {boolean} [getter=false] Is a getter?
   * 
   * This option literally just changes the phrasing of the
   * error message to use 'getter' instead of 'method'.
   * 
   */
  constructor(name, getter=false)
  {
    let msg = "Abstract ";
    msg += (getter ? 'getter ' : 'method ');
    if (name) msg += `'${name}' `;
    msg += 'not implemented';
    super(msg);
    this.name = 'AbstractError';
  }
}

exports.AbstractError = AbstractError;

/**
 * Function prototypes for async, generator, and async generator functions.
 * @namespace
 * @alias module:@lumjs/core.Functions
 */
const Functions =
{
  /**
   * Constructor for dynamic generator functions.
   */
  Generator: Object.getPrototypeOf(function*(){}).constructor,

  /**
   * Constructor for dynamic async functions.
   */
  Async: Object.getPrototypeOf(async function(){}).constructor,

  /**
   * Constructor for dynamic async generator functions.
   */
  AsyncGenerator: Object.getPrototypeOf(async function*(){}).constructor,

}

exports.Functions = Functions;

/**
 * A placeholder function for when something is not implemented.
 * 
 * @param {boolean} [fatal=true] If `true` throw Error.
 *   If `false` use `console.error()` instead.
 * @param {string} [prefix=''] A prefix for the error message.
 * 
 * @returns {void}
 * @alias module:@lumjs/core.NYI
 */
function NYI(fatal=true, prefix='') 
{ 
  const msg = prefix+"« NOT YET IMPLEMENTED »";
  if (fatal)
    throw new Error(msg);
  else
    console.error(msg);
}

exports.NYI = NYI;

/**
 * Send a deprecation message with a stack trace.
 * 
 * @param {string} dep - Name of what is deprecated
 * @param {(string|string[])} [rep] Replacement suggestion(s).
 * @param {*} [ret] Value to return
 * @returns {mixed} `ret`
 * @alias module:@lumjs/core.deprecated
 */
function deprecated(dep, rep, ret)
{
  const msgs = [dep,'is deprecated'];
  if (rep)
  {
    msgs.push('replace with', rep);
  }
  console.trace(...msgs);
  return ret;
}

exports.deprecated = deprecated;

/**
 * Assign a getter property that when accessed will
 * show a deprecation message via `deprecated()` function
 * before returning the deprecated property value.
 * 
 * @param {object} obj - Target to assign property on
 * @param {string} prop - Property to assign
 * @param {(object|function)} spec - Specification
 * 
 * If this is a `function` it will be used as the `spec.get` value.
 * 
 * @param {function} spec.get - The function that returns the real value
 * @param {string} [spec.dep=prop] Name of what is deprecated;
 * defaults to `prop` if omitted.
 * @param {(string|string[])} [spec.rep] Replacement suggestion(s).
 * @param {object} [spec.opts] Options for `def()` to add getter with.
 * 
 * @returns {object} `obj`
 */
function wrapDepr(obj,prop,spec)
{
  if (typeof spec === F)
    spec = {get: spec};
  if (typeof spec.get !== F) 
    throw new TypeError("invalid init");

  return def(obj, prop, 
  {
    get: () =>
      deprecated(spec.dep??prop, spec.rep, spec.get())
  }, spec.opts);
}

exports.wrapDepr = wrapDepr;

// This is near the bottom, but before any calls to wrapDepr.
const def = require('./types/def');

wrapDepr(exports, 'AbstractClass', () => require('./old/abstractclass'));
