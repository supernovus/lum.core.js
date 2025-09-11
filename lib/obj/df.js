"use strict";

const {B,F,doesDescriptor} = require('../types/basics');
const {needObj,needType} = require('../types/needs');
const TYPES = require('../types/typelist');

const DEF_DESC = {configurable: true}

const cp = Object.assign;
const clone = (...args) => cp({}, ...args);
const dps = Object.defineProperties;

/**
 * Handle populating descriptor objects for df() and family.
 * 
 * Alias: `df.descriptor()`
 * @alias module:@lumjs/core/obj~descriptor
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
 * A wrapper around Object.defineProperty() which simplifies things a bit.
 * 
 * Alias: `df.one`
 * @alias module:@lumjs/core/obj.df
 * 
 * @param {(object|function)} obj - Target to define property in
 * @param {(string|symbol)} name  - Property identifier
 * @param {*} value - Value to assign
 * 
 * See `opts.useDesc` for how this value is handled in regards to
 * whether it is treated as a property descriptor or a plain data value.
 * 
 * @param {(object|function|boolean)} [opts] Options
 * 
 * If this is a boolean, it will be used as `opts.useDesc`.
 * 
 * If both `value` and this are functions, then they will be used
 * as the `get` and `set` descriptor values and `opts.useDesc` will
 * be set to `true`.
 * 
 * See {@link module:@lumjs/core/obj~descriptor} for more options that
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
 * @returns {(object|function)} `obj`
 */
function df(obj, name, value, opts={})
{
  const log = {obj,name,value,opts};
  needObj(obj, {log, fun: true});
  needType(TYPES.PROP, name, {log});

  if (typeof opts === B)
  {
    opts = {useDesc: opts};
  }
  else if (typeof opts === F && typeof value === F)
  {
    value = {get: value, set: opts};
    opts = {useDesc: true};
  }

  const useDesc = opts.useDesc ?? doesDescriptor(value);
  const desc = descriptor((useDesc ? value : {value}), opts);
  
  return Object.defineProperty(obj, name, desc);
}

df(df, 'one', df);
df(df, 'descriptor', descriptor);

/**
 * A wrapper around df() that defines multiple properties at once.
 *
 * Alias: `df.all`
 * @alias module:@lumjs/core/obj.dfa
 * 
 * @param {(object|function)} obj - Target to define property in
 * @param {object} values 
 * All string-keyed enumerable properties will be passed to df()
 * @param {(object|boolean)} [opts] See df() for details
 * 
 * @returns {(object|function)} `obj`
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
 * Build closures to define properties using a chained syntax.
 * 
 * This creates closures for df(), dfa(), and lazy().
 * You can switch between them using special properties.
 * 
 * The closures when called will pass their arguments to the function
 * they are wrapping, and in a bit of brain-melting recursion, the
 * return value from each closure is the closure itself.
 * 
 * Special Properties that are added to all of the closures:
 * 
 * - `one(name, val, [set])` → A closure that wraps df();
 *   `set` (setter function) is only used if `val` is a getter function.
 * - `all(values)`           → A closure that wraps dfa()
 * - `lazy(name, func)`      → A closure that wraps lazy()
 * - `update(opts)`          → Update the options used by the closures.
 *   Uses Object.assign() to copy options from the specied object
 *   to the internal options object from the original dfor() call.
 *   This is a method call, NOT a closure function.
 * - `opts`                  → The options object used by the closures.
 * - `obj`                   → The target object used by the closures.
 * - `for(obj)`              → A wrapper method that will call dfor().
 *   When using this method, a *new set of closures* will be created,
 *   with the current options, but a new target object.
 *   If you use this in a chained statement, any calls after this
 *   will be using the new closures rather than the original ones.
 * - `prev`                  → The previous closure(s) from which
 *   the chained `for()` method was called. If there is no previous
 *   set of closures, then this will return the current closure.
 * 
 * Alias: `df.for()`
 * @alias module:@lumjs/core/obj.dfor
 * 
 * @param {(object|function)} obj - Target to define property in;
 * available as the `obj` magic property on the closures.
 * 
 * @param {object} [opts] Options - see df() for details;
 * available as the `opts` magic property on the closures.
 * 
 * @param {?function} [prev=null] INTERNAL USE ONLY;
 * if the `for()` wrapper method is used in a closure,
 * that closure will be passed here, which makes returning
 * to the previous closure possible.
 * 
 * @returns {function} The `one` closure.
 */
function dfor(obj, opts={}, prev=null)
{
  const fnOne = function (name, value, setter)
  {
    if (typeof setter === F && typeof value === F)
    {
      value = {get: value, set: setter}
      opts = clone(opts, {useDesc: true});
    }
    df(obj, name, value, opts);
    return fnOne;
  }

  const fnAll = function (values) 
  { 
    dfa(obj, values, opts);
    return fnAll;
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
    lazy: {value: fnLazy},
    prev: {get() { return prev ?? this }},
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

        return dfor(newobj, opts);
      },
    },
  }

  dps(fnOne,  ctx);
  dps(fnAll,  ctx);
  dps(fnLazy, ctx);

  return fnOne;
}

df(df, 'for', dfor);

/**
 * Build a lazy initializer property.
 * 
 * This builds an *accessor* property that will replace itself
 * with a initialized property, the value of which is obtained from
 * a supplied initialization function. Any subsequent use of the
 * property will obviously be using the initialized property directly.
 * 
 * The general purpose is if there is a property that requires
 * a fairly intensive load time, or requires a large library that
 * you may not always *need* for basic things, you can use this
 * to ensure that the property is only initialized when needed.
 * 
 * Alias: `df.lazy`
 * @alias module:@lumjs/core/obj.lazy
 *
 * @param {(object|function)} target - The object to add the property to.
 * 
 * @param {string} name - The name of the property to add.
 * 
 * @param {module:@lumjs/core/obj~LazyGetter} initfunc 
 * The function to initialize the property.
 * 
 * This will normally only ever be called the first time the property
 * is accessed in a *read* operation. The return value from this
 * will be assigned to the property using `def()`, replacing the
 * lazy accessor property.
 * 
 * @param {object} [opts] Options to customize behavior.
 * 
 * @param {module:@lumjs/core/obj~LazySetter} [opts.set]
 * A function to handle assignment attempts.
 * 
 * This obviously only applies to the *lazy accessor* property,
 * and will have no affect once the property has been replaced
 * by its initialized value.
 * 
 * @param {boolean} [opts.enumerable=false] Is the property enumerable?
 * 
 * This applies to the *lazy accessor* property only.
 * You can set custom descriptor rules in the `initfunc`
 * if you need them on the initialized property.
 * 
 * @param {?boolean} [opts.assign] The *default* value for the `assign` property
 * in the [LazyDef]{@link module:@lumjs/core/obj~LazyDef} object.
 * 
 * @param {*} [opts.df] The *default* value for the `df`/`def` property in
 * the [LazyDef]{@link module:@lumjs/core/obj~LazyDef} object.
 * 
 * @param {*} [opts.def] Alias of `opts.df` for compatibility.
 *
 * @returns {(object|function)} The `target` argument
 */
function lazy(target, name, initfunc, opts={})
{
  let log = {target, name, initfunc, opts};
  needObj(target, {log, fun: true});
  needType(TYPES.PROP, name, {log});
  needType(F, initfunc, {log});
  needObj(opts, {log});

  // The `this` object for the functions.
  const ctx = 
  { 
    name, 
    target, 
    opts, 
    arguments,
    assign: opts.assign,
    df: opts.df ?? opts.def ?? {},
  }
  ctx.def = ctx.df;

  // The descriptor for the lazy accessor.
  const desc = 
  {
    configurable: true, 
    enumerable: opts.enumerable ?? false,
  };

  // Replace the property if rules are correct.
  const defval = function(value)
  {
    if (ctx.assign ?? value !== undefined)
    { // Replace the lazy accessor with the returned value.
      df(target, name, value, ctx.df);
      // Now return the newly assigned value.
      return target[name];
    }
    else if (doesDescriptor(value))
    { // A descriptor was returned, extract the real value.
      if (typeof value.get === F)
      {
        return value.get();
      }
      else 
      {
        return value.value;
      }
    }
    else 
    { // Just return the original value.
      return value;
    }
  }

  desc.get = function()
  { 
    return defval(initfunc.call(ctx,ctx));
  }

  if (typeof opts.set === F)
  { // We want to assign a lazy setter as well.
    desc.set = function(value)
    {
      defval(opts.set.call(ctx,value,ctx));
    }
  }

  // Assign the lazy accessor property.
  return df(target, name, desc);
}

df(df, 'lazy', lazy);
df(lazy, 'df', df);
// TODO: remove this for v2.x
lazy(lazy, 'def', () => require('../types/def'));

module.exports = {descriptor, df, dfa, dfor, lazy}
