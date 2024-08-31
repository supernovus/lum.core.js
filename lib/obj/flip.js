"use strict";

const {B,S,isObj,needObj,isMapOf,isa,isArray} = require('../types');

/**
 * Flip an object's keys and values.
 * 
 * Is a wrapper around the other `flip*` functions.
 * 
 * @alias module:@lumjs/core/obj.flip
 * 
 * @param {object} obj - Object to flip.
 * 
 * If `obj` is a `Map`, passes it to `flipMap()`.
 * Anything else will be passed to `flipKeyVal()`.
 * 
 * Other supported types may be added in the future.
 * 
 * @param {object} [opts] Any options supported by the
 * underlying `flip*` functions that may be called.
 * 
 * @returns {object} Object with flipped keys and values.
 * 
 * @throws {Error} See the underlying functions for exact error types.
 * 
 * @see {@link module:@lumjs/core/obj.flipKeyVal}
 * @see {@link module:@lumjs/core/obj.flipMap}
 */
function flip(obj, opts={})
{
  if (obj instanceof Map)
  {
    return flipMap(obj, opts);
  }
  else
  {
    return flipKeyVal(obj, opts);
  }
}

/**
 * Flip a plain object's keys and values.
 * 
 * Works for _enumerable_ properties with _non-duplicate_ `string` values.
 * 
 * @param {object} inObj - The input object to flip.
 * 
 * @param {object} [opts] Options
 * @param {boolean} [opts.warnDup=true] Use `console` on duplicate values?
 * @param {boolean} [opts.fatalDup=false] Throw Error on duplicate values?
 * @param {boolean} [opts.warnStr=true] Use `console` on non-string values?
 * @param {boolean} [opts.fatalStr=false] Throw Error on non-string values?
 * 
 * @returns {object} A new `object` with flipped keys and values.
 * 
 * @throws {TypeError} If `obj` was not a valid `object`,
 * or if `fatalStr` is `true` and a non-string value is found.
 * 
 * @throws {ReferenceError} If `fatalDup` is `true`
 * and a duplicate value is found.
 * 
 * @alias module:@lumjs/core/obj.flipKeyVal
 */
function flipKeyVal(inObj, opts={})
{
  needObj(inObj);

  const wdup = opts.warnDup  ?? true,
        fdup = opts.fatalDup ?? false,
        wstr = opts.warnStr  ?? true,
        fstr = opts.fatalStr ?? false;

  const outObj = {};

  for (const key in inObj)
  {
    const val = inObj[key];
    if (typeof val === S)
    {
      if (outObj[val] === undefined)
      {
        outObj[val] = key;
      }
      else
      {
        if (wdup) console.error({key, val, obj: inObj});
        if (fdup) throw new ReferenceError("Duplicate value");
      }
    }
    else
    {
      if (wstr) console.error({key, val, obj: inObj});
      if (fstr) throw new TypeError("Non-string value");
    }
  }

  return outObj;
}

/**
 * Flip the keys and values of a `Map`.
 * 
 * @param {Map} inMap - The input Map to flip.
 * 
 * @param {object} [opts] Options
 * 
 * @param {boolean} [opts.warn=true]   Log warnings with `console`?
 * @param {boolean} [opts.fatal=false] Throw Errors for invalid parameters?
 * 
 * @param {object} [opts.valid] Validate the `inMap` keys/values?
 * @param {?Array} [opts.valid.keys=null] Valid key type tests.
 * @param {?Array} [opts.valid.values=null] Validate value type tests.
 * 
 * @param {(boolean|object)} [opts.valid.map=false] Validate entire map?
 * 
 * If this is `true` or an `object` then the entire `inMap` will be tested 
 * using `isMapOf()`. If an `object`, it will be used as the `rules`
 * to pass to `isMapOf()` (the `inMap` will be assigned as `rules.value`).
 * If the validation fails when this is `true`, no attempt to flip the
 * map will be done.
 * 
 * If this is `false`, but at least one of `.keys` or 
 * `.values` is set, then each key and/or value will be tested using
 * the `isa()` function, and any invalid key-val pair will be skipped.
 * 
 * If not specified, this will default to the value of the `.fatal` option.
 * 
 * @param {boolean} [opts.valid.warn] Use `console` if validation failed?
 * 
 * If `.map` is `true`, the console will only have one log entry added
 * with the results of the `isMapOf()` test.
 * 
 * If `.map` is `false`, the console will have an entry for every
 * invalid key-val pair in the `inMap`.
 * 
 * If not specified, this will default to the value of the `..warn` option.
 * 
 * @param {boolean} [opts.valid.fatal] Throw Error on invalid `inMap`?
 * 
 * Only applicable if `.map` is `true`.
 * If not specified, this will default to the value of the `..fatal` option.
 * 
 * @returns {?Map} A new Map with flipped keys and values.
 * 
 * @throws {TypeError} Thrown in specific situations:
 * 
 * - If `inMap` is not a valid `Map` and `opts.fatal` is `true`.
 * 
 * - If both `opts.valid.map` and `opts.valid.fatal` are `true`,
 *   and the validation tests against the `inMap` object fail.
 * 
 * @alias module:@lumjs/core/obj.flipMap
 */
function flipMap(inMap, opts={})
{
  const warn  = opts.warn  ?? true;
  const fatal = opts.fatal ?? false;

  if (!(inMap instanceof Map))
  {
    const errMsg = "Invalid Map instance";

    if (warn)
    {
      const log = [{inMap, opts}];
      if (!fatal) log.unshift(errMsg);
      console.error(log);
    }
    
    if (fatal)
    {
      throw new TypeError(errMsg);
    }
    else
    {
      return null;
    }
  }

  const vopts  = opts.valid  ?? {};
  const vwarn  = vopts.warn  ?? warn;
  const vfatal = vopts.fatal ?? fatal;
  const vmap   = vopts.map   ?? vfatal;

  const vkeys = isArray(vopts.keys)   ? vopts.keys   : null;
  const vvals = isArray(vopts.values) ? vopts.values : null;

  function validate(key, val)
  {
    if (vkeys && !isa(key, ...vkeys))
    {
      if (vwarn)
      {
        console.error("Invalid Key", {key, val});
      }
      return false;
    }

    if (vvals && !isa(val, ...vvals))
    {
      if (vwarn)
      {
        console.error("Invalid Value", {key, val});
      }
      return false;
    }

    return true;
  }

  if (vmap)
  { // Validating the entire input Map.
    const rules = isObj(vmap) ? vmap : {};
    const valid = isMapOf(rules, vkeys, vvals);

    let passed = false;
    if (typeof valid === B)
    {
      passed = valid;
    }
    else if (isObj(valid) && typeof valid.pass === B)
    {
      passed = valid.pass;
    }

    if (!passed)
    {
      if (vwarn)
      { // Log to the console.
        console.error("Map validation failed", {inMap, opts, valid});
      }
      if (vfatal)
      {
        throw new TypeError("Invalid Map content");
      }
      else
      { // We're done here. 
        return null;
      }
    }
  }

  const outMap = new Map();

  for (const [key, val] of inMap)
  {
    if (!vmap && !validate(key, val))
    { // Skip invalid key-val pair.
      continue;
    }
    outMap.set(val, key);
  }

  return outMap;
}

module.exports =
{
  flip, flipKeyVal, flipMap,
}
