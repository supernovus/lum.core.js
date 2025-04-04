"use strict";

const {doesDescriptor,needObj,needType,lazy,B,TYPES} = require('../types');

const DEF_DESC = {configurable: true}

const cp = Object.assign;
const clone = (...args) => cp({}, ...args);
const dps = Object.defineProperties;

/**
 * Handle populating descriptor objects for df() and family.
 * 
 * Exported as `obj.df.descriptor`, but since jsdoc doesn't like
 * properties attached to functions, I've listed it as internal.
 * 
 * @param {object} desc - Descriptor object from df()
 * @param {object} opts - Options from df();
 * 
 * Will be checked for default descriptor options in the
 * case where those options were not explicitly defined
 * in the descriptor object.
 * 
 * @param {boolean} [opts.configurable=true] configurable rule;
 * this is the only option with a fallback default value.
 * 
 * @param {boolean} [opts.enumerable] enumerable rule
 * 
 * @param {boolean} [opts.writable] writable rule;
 * only applies to data descriptors (ones with a `value` property),
 * NOT to accessor descriptors.
 * 
 * @returns {object} `desc`
 * @alias module:@lumjs/core/obj~descriptor
 */
function descriptor(desc, opts)
{
  opts = clone(DEF_DESC, opts);

  const dps = ['configurable', 'enumerable'];
  if (desc.value) dps.push('writable');

  for (const dp of dps)
  {
    if (typeof desc[dp] !== B && typeof opts[dp] === B)
    {
      desc[dp] = opts[dp];
    }
  }

  return desc;
}

/**
 * A replacement for `types.def()`, but MUCH simpler.
 *
 * Instead of one function where every argument has several different
 * purposes depending on the type of value, there are now a bunch
 * of functions, each one with a single purpose, and a single signature.
 * 
 * This is the main one that all the rest use and is just a wrapper
 * around Object.defineProperty() that simplifies its use a bit.
 * 
 * @param {(object|function)} obj - Target to define property in
 * @param {(string|symbol)} name  - Property identifier
 * @param {*} value - Value to assign
 * 
 * See `opts.useDesc` for how this value is handled in regards to
 * whether it is treated as a property descriptor or a plain data value.
 * 
 * @param {object} [opts] Options
 * 
 * See {@link module:@lumjs/core/obj~descriptor} for options that
 * are used as descriptor defaults when assigning the property.
 * 
 * @param {?boolean} [opts.useDesc=null] Treat `value` is a descriptor?
 * 
 * If this is set to `true` then the `value` will be assumed to be a
 * valid descriptor object; no tests will be done to confirm, so be sure!
 * 
 * If this is set to `false` then a descriptor of `{value}` will be created.
 * Again, no tests will be done, so this is a way to assign properties that
 * have `value`, `get`, or `set` properties in them.
 * 
 * If this is `null` (the default), then the `value` will be tested with
 * [doesDescriptor()]{@link module:@lumjs/core/types.doesDescriptor}, 
 * and that will determine if the value is treated as a descriptor or not.
 * 
 * @returns {object} `obj`
 * @alias module:@lumjs/core/obj.df
 */
function df(obj, name, value, opts={})
{
  const log = {obj,name,value,opts};
  needObj(obj, {log, fun: true});
  needType(TYPES.PROP, name, {log});

  const useDesc = opts.useDesc ?? doesDescriptor(value);
  const desc = descriptor((useDesc ? value : {value}), opts);
  
  return Object.defineProperty(obj, name, desc);
}

// Sub-export
df(df, 'descriptor', descriptor);
df(df, 'lazy',       lazy);

/**
 * A wrapper around df() that defines multiple properties at once.
 * 
 * @param {(object|function)} obj - Target to define property in
 * @param {object} values 
 * All string-keyed enumerable properties will be passed to df()
 * @param {object} [opts] See df() for details
 * 
 * @returns {object} `obj`
 * @alias module:@lumjs/core/obj.dfa
 */
function dfa(obj, values, opts)
{
  const log = {obj,values,opts};
  needObj(values, {log});

  for (const key in values)
  {
    df(obj, key, values[key], opts);
  }

  return obj;
}

df(df, 'all', dfa);

/**
 * A wrapper around df() that defines an *accessor property* with 
 * BOTH a getter and a setter specified explicitly.
 * 
 * @param {(object|function)} obj - Target to define property in
 * @param {(string|symbol)} name - Property identifier
 * @param {function} getter - Getter function
 * @param {function} setter - Setter function
 * @param {object} [opts] Options
 * 
 * The actual options passed to df() will be a clone, with the
 * `useDesc` option explicitly forced to `true`.
 * 
 */
function dfb(obj, name, getter, setter, opts)
{
  const log = {obj,name,getter,setter,opts};
  opts = clone(opts, {useDesc: true});
  return df(obj, name, {get: getter, set: setter}, opts);
}

df(df, 'both', dfb);

/**
 * Build magic closures to define properties using a chained syntax.
 * 
 * This actually creates closures for df(), dfa(), dfb(), and lazy().
 * You can switch between them using magic properties.
 * 
 * The closures when called will pass their arguments to the function
 * they are wrapping, and in a bit of brain-melting recursion, the
 * return value from each closure is the closure itself.
 * 
 * Magic Properties that are added to both closures:
 * 
 * - `one(name, value)` → A closure that wraps df()
 * - `all(values)`      → A closure that wraps dfa()
 * - `both(name, g, s)` → A closure that wraps dfb()
 * - `lazy(name, func)` → A closure that wraps lazy()
 * - `update(opts)`     → Update the options used by the closures.
 *   Uses Object.assign() to copy options from the specied object
 *   to the internal options object from the original dfc() call.
 *   This is a method call, NOT a closure function.
 * - `opts`             → The actual options object used by the closures.
 * - `obj`              → The target object used by the closures.
 * - `for(obj)`         → A wrapper method that will call dfc().
 *   When using this method, a *new set of closures* will be created,
 *   with the current options, but a new target object.
 *   If you use this in a chained statement, any calls after this
 *   will be using the new closures rather than the original ones.
 * 
 * @param {(object|function)} obj - Target to define property in;
 * available as the `obj` magic property on the closures.
 * 
 * @param {object} [opts] Options - see df() for details;
 * available as the `opts` magic property on the closures.
 * 
 * @returns {function} The `one` closure.
 */
function dfc(obj, opts={})
{
  const fnOne = function (name, value)
  {
    df(obj, name, value, opts);
    return fnOne;
  }

  const fnAll = function (values) 
  { 
    dfa(obj, values, opts);
    return fnAll;
  }

  const fnBoth = function (name, getter, setter)
  {
    dfb(obj, name, getter, setter, opts);
    return fnBoth;
  }

  const fnLazy = function (name, initfunc)
  {
    lazy(obj, name, initfunc, opts);
    return fnLazy;
  }

  const ctx =   
  {
    obj:  {value: obj},
    opts: {value: opts},
    one:  {value: fnOne},
    all:  {value: fnAll},
    both: {value: fnBoth},
    lazy: {value: fnLazy},
    update: 
    {
      value()
      {
        cp(opts, ...arguments);
        return this;
      },
    },
    for:
    {
      value(newobj)
      {
        return dfc(newobj, opts);
      },
    },
  }

  // Quick alias
  ctx.next = ctx.for;

  dps(fnOne,  ctx);
  dps(fnAll,  ctx);
  dps(fnBoth, ctx);
  dps(fnLazy, ctx);

  return fnOne;
}

df(df, 'for', dfc);

module.exports = 
{
  df, dfa, dfb, dfc, lazy,
}
