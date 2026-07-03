/**
 * Meta-programming helpers. 
 * @module @lumjs/core/meta
 */
'use strict';

const { getOwnKeys, keyName } = require('./obj/keys');
const { isIterable, isObj } = require('./types/basics');

/**
 * Get a stacktrace. 
 *
 * Uses the `stack` property of an `Error` object as the source.
 * Every runtime differs greatly in what is contained in the `stack` text,
 * so this may not be particularly useful. For a more complete solution, 
 * try the `stacktrace-js` library.
 *
 * @param {string} [msg] - A message for the Error object.
 *
 * @returns {string[]} An array of stack strings.
 * @alias module:@lumjs/core/meta.stacktrace
 */
function stacktrace(msg) {
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
 * @alias module:@lumjs/core/meta.AbstractError
 */
class AbstractError extends Error {
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
  constructor(name, getter = false) {
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
 * @alias module:@lumjs/core/meta.Functions
 */
const Functions =
{
  /**
   * Constructor for dynamic generator functions.
   */
  Generator: Object.getPrototypeOf(function* () { }).constructor,

  /**
   * Constructor for dynamic async functions.
   */
  Async: Object.getPrototypeOf(async function () { }).constructor,

  /**
   * Constructor for dynamic async generator functions.
   */
  AsyncGenerator: Object.getPrototypeOf(async function* () { }).constructor,

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
 * @alias module:@lumjs/core/meta.NYI
 */
function NYI(fatal = true, prefix = '') {
  const msg = prefix + "« NOT YET IMPLEMENTED »";
  if (fatal)
    throw new Error(msg);
  else
    console.error(msg);
}

exports.NYI = NYI;

function defaultDeprecateItemHandler(item) {
  let { depVar } = this.opts;
  if (depVar && typeof item === 'string') {
    return item.trim().replaceAll(depVar, this.dep);
  }
  else if (this.setOpts && isObj(item)) {
    Object.assign(this.opts, item);
    return this.next = true;
  }
  return item;
}

const DEP_OPTS =
{
  depVar: '{DEP}',
  handle: defaultDeprecateItemHandler,
  preDep: '[DEPRECATED]:',
}

/**
 * Send a deprecation message to the console (low-level).
 * 
 * Will default to using `console.warn()` to send the message, however
 * it can be made to use `console.trace()` instead if one of the following
 * evaluates to a true value:
 * - `core.env.get('LUM_TRACE_DEPRECATED')`
 * - `core.state.get('core.traceDeprecated')`
 * As the state module is deprecated, as of 2.x only the env.get() test
 * will continue to work.
 * 
 * @param {string} dep - Name of what is deprecated.
 * @param {...mixed} [info] Additional information.
 * 
 * This may be used to suggest replacements, or whatever other
 * information you want to include in the logs.
 * 
 * TODO: document how functions are handled.
 */
function deprecate(dep, ...info) {

  let stateLib = require('./state');
  let fn = stateLib.eors('LUM_TRACE_DEPRECATED', 'core.traceDeprecated')
    ? 'trace'
    : 'warn';

  let ctx = {
    add: true,
    dep,
    done: false,
    info,
    logs: [],
    next: false,
    opts: Object.assign({showDep: dep}, DEP_OPTS),
    setOpts: true,
  }

  for (let item of info) {
    if (typeof item === 'function') {
      item.call(ctx, ctx);
    }
    else {
      if (typeof ctx.opts.handle === 'function') {
        ctx.next = false;
        item = ctx.opts.handle.call(ctx, item, ctx);
        if (ctx.next) continue; // Move on.
      }

      if (ctx.add) {
        if (ctx.logs.length === 0 && ctx.opts.preDep) {
          ctx.logs.push(ctx.opts.preDep);
        }
        ctx.logs.push(ctx.opts.showDep || ctx.dep || dep);
        ctx.add = false;
      }

      if (item) {
        ctx.logs.push(item);
      }
    }
    if (ctx.done) break; // No more items, we're done.
  }

  console[fn](...ctx.logs);
  return ctx.return ?? ctx.opts.return;
}

exports.deprecate = deprecate;

const DED_OPTS =
{
  preRep: 'replace with',
}

/**
 * Send a deprecation message to the console (simple).
 * 
 * This is now a frontend to the newer `deprecate()` function,
 * which may replace it entirely one day.
 * 
 * @param {string} dep - Name of what is deprecated.
 * @param {?(string|string[])} [rep] Replacement suggestion(s).
 * @param {mixed} [ret] Value to return
 * @param {object} [opts] Formatting options.
 *
 * @returns {mixed} `ret`
 * @alias module:@lumjs/core/meta.deprecated
 */
function deprecated(dep, rep, ret, opts) {
  opts = Object.assign({}, DED_OPTS, opts);
  rep = Array.isArray(rep) ? rep.slice(0) : [rep];
  if (opts.preRep) rep.unshift(opts.preRep);
  return deprecate(dep, opts, ...rep);
}

exports.deprecated = deprecated;

/**
 * Assign a getter property that when accessed will
 * show a deprecation message via `deprecated()` function
 * before returning the deprecated property value.
 * 
 * @param {(object|function)} obj - Target to assign property on.
 * @param {(string|symbol)} prop - Property to assign.
 * @param {(object|function)} spec - Specification.
 * 
 * If this is a `function` it will be used as the `spec.get` value.
 * 
 * @param {function} spec.get - The function that returns the real value
 * @param {string} [spec.dep=prop] Name of what is deprecated;
 * defaults to `prop` if omitted.
 * @param {(string|string[])} [spec.rep] Replacement suggestion(s).
 * @returns {object} `obj`
 * 
 * @alias module:@lumjs/core/meta.wrapDepr
 */
function wrapDepr(obj, prop, spec) {
  if (typeof spec === 'function')
    spec = { get: spec };
  if (typeof spec.get !== 'function')
    throw new TypeError("invalid init");

  let getter;
  if (spec.rep) { // Original style using deprecated() function.
    getter = () =>
      deprecated(spec.dep ?? prop, spec.rep, spec.get(), spec)
  }
  else {
    getter = () => {
      let info = Array.isArray(spec.info) ? spec.info.slice(0) : [];
      return deprecate(spec.dep ?? prop, {return: spec.get()}, spec, ...info);
    }
  }

  return Object.defineProperty(obj, prop, {
    configurable: true,
    get: getter,
  });
}

exports.wrapDepr = wrapDepr;

wrapDepr(exports, 'AbstractClass', () => require('./old/abstractclass'));

const FUN_RESERVED = new Set(['prototype', 'length', 'name']);
const FILTER_FUN = (key) => !FUN_RESERVED.has(key)

/**
 * Deprecate an entire module.
 * 
 * This will use `getOwnKeys()` to get a list of properties in a module,
 * and will create a wrapped version that will use `wrapDepr()` for each
 * of the properties.
 * 
 * @param {(object|function)} src - The exported module.
 * 
 * If this is a function, a wrapped version that calls deprecated()
 * before passing all arguments will be created. It will also use
 * the name of the function as a default `basespec.dep` value.
 * 
 * @param {(object|string)} [basespec] Base specification.
 * 
 * If this is a string it will be used as the `basespec.dep` option.
 * 
 * Properties in this will be used as the defaults for the `spec` for each
 * property in the `src` when calling the `wrapDepr()` function, with the
 * exception of `dep` (see below for how it is handled), and `get` which
 * is generated automatically for each property.
 * 
 * @param {string} [basespec.dep] The name of the module being deprecated.
 * 
 * If this is specified as a non-empty string then the spec for each property
 * will use `{dep: basespec.dep+sep+key}`; otherwise it will use `key` alone.
 * 
 * @param {function} [basespec.filter] Filter the properties.
 * 
 * If this is specified it will be passed to `keys.filter()` to filter
 * the keys that will actually be created in the destination object.
 * 
 * If `src` is a *function*, and this is NOT specified, then a *default*
 * will be used that excludes `[prototype, length, name]` from the keys.
 * 
 * There is NO default when `src` is an *object*.
 * 
 * @param {string} [basespec.sep] Value to use as `sep` (see `basespec.dep`).
 *
 * The default is a single dot (`.`) character.
 * 
 * @param {object} [dest] Object to add wrapped properties to.
 * 
 * This is only applicable if `src` is an *object*. 
 * It will NOT be used when `src` is a *function*.
 * If not specified, an empty object will be created.
 * 
 * @returns {(object|function)} Return value depends on the type of `src`.
 */
function deprecateAll(src, basespec, dest = {}) {
  if (typeof basespec === 'string') {
    basespec = Object.assign({ dep: basespec }, DED_OPTS);
  }
  else {
    basespec = Object.assign({}, DED_OPTS, basespec);
  }

  let hasName = () =>
    (typeof basespec.dep === 'string' && basespec.dep.trim() !== '');

  let getInfo = (spec) => {
    let info = Array.isArray(spec.info) 
      ? spec.info.slice(0)     
      : [];
    if (spec.rep) {
      info.push(spec.rep);
      delete spec.rep;
    }
    return info;
  }

  let keys = getOwnKeys(src);
  let sep = basespec.sep ?? '.';

  if (typeof src === 'function') {
    if (!hasName()) basespec.dep = src.name;
    if (!basespec.filter) basespec.filter = FILTER_FUN;

    dest = function () {
      let fun = {src, arguments};
      let spec = Object.assign({}, basespec, {fun});
      let info = getInfo(spec);
      deprecate(spec.dep, spec, ...info);
      return src.apply(this, arguments);
    }
  }

  if (typeof basespec.filter === 'function') {
    keys = keys.filter(basespec.filter);
  }

  hasName = hasName(); // finalise

  for (let key of keys) {
    //let dep = hasName ? basespec.dep + sep + keyName(key) : key;
    let spec = Object.assign({}, basespec, { 
      dep: key,
      get: () => src[key],
    });

    if (hasName) {
      spec.info = getInfo(spec);
      if (basespec.preRep) spec.info.unshift(basespec.preRep);
      spec.showDep = basespec.dep + sep + keyName(key);
    }

    wrapDepr(dest, key, spec);
  }

  return dest;
}

exports.deprecateAll = deprecateAll;
