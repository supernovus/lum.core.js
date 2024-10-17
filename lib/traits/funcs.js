"use strict";

const getProp = require('../obj/getproperty');
const 
{
  def,F,B,needObj,
  isObj,isArray,isConstructor,isProperty,isClassObject,
} = require('../types');

// Symbol for private storage of composed traits.
const COMPOSED_TRAITS = Symbol.for('@lumjs/core/traits~ComposedTraits');

const FLAG_ET = 1; // Flag for ensure target
const FLAG_ES = 2; // Flag for ensure source
const FLAGS_S = 0; // Default flags for static mode
const FLAGS_O = 3; // Default flags for object mode

/**
 * For when we need a prototype object exclusively.
 * 
 * @param {(function|object)} from - Target
 * 
 * May either be a class constructor `function`, or a prototype `object`.
 * 
 * @returns {object}
 * 
 * If `from` is an `object` it will be returned as-is.
 * If `from` is a `function` then `from.prototype` will be returned.
 * 
 * @throws {TypeError} If `from` was not a valid value;
 * including if it is a function but does not have a valid
 * prototype object to return.
 * 
 * @alias module:@lumjs/core/traits.ensureProto
 */
function ensureProto(from)
{
  if (isObj(from))
  { // Assume an object is already a prototype.
    return from;
  }
  else if (isConstructor(from))
  { // It's a constructor, return its prototype.
    return from.prototype;
  }
  else
  {
    throw new TypeError("Invalid class constructor or instance object");
  }
}

/**
 * For when we need a constructor function exclusively.
 * 
 * @param {(function|object)} from - Target
 * 
 * May either be a class constructor `function`, or an `object` instance.
 * 
 * @returns {function}
 * 
 * If `from` is a constructor function it will be returned as-is.
 * If `from` is an object instance (with a constructor other than `Object`),
 * then the `from.constructor` value will be returned.
 * 
 * @throws {TypeError} If `from` was not a valid value;
 * including if it was a function without a prototype,
 * or an object with a constructor of `Object`.
 * 
 * @alias module:@lumjs/core/traits.ensureConstructor
 */
function ensureConstructor(from)
{
  if (isConstructor(from))
  { // Good to go
    return from;
  }
  else if (isClassObject(from))
  { // An instance of a class (other than `Object` itself)
    return from.constructor;
  }
  else
  {
    throw new TypeError("Invalid class constructor or instance object");
  }
}

const hasOwn 
  = (typeof Object.hasOwn === F)
  ? Object.hasOwn 
  : (obj,prop) => obj.hasOwnProperty(prop);

/**
 * Default list of properties to ignore if `opts.static` is `true`.
 * 
 * If you specify your own `opts.filter` values, you should probably
 * use this list as well.
 * 
 * @see module:@lumjs/core/traits.compose
 * @type {Array}
 * @alias module:@lumjs/core/traits.IGNORE_STATIC
 */
const IGNORE_STATIC = 
[
  // Possible properties from `function` values.
  'length', 'name', 'arguments', 'caller', 'prototype',
  // Defined static methods from the Trait abstract class.
  'composeInto', 'setupTrait', 'getComposed', 'decomposeFrom', 
  'removeTrait', 'removedTrait',
  // Optional static getter properties for the Trait abstract class.
  'composeOptions', 'staticOptions',
];

/**
 * Get a composed definition list.
 * 
 * @param {(function|object)} target - Target to look in.
 * @param {(function|object)} [source] Source trait to get defs for.
 * 
 * @param {boolean} [tryClass=true] Try the class constructor as well?
 * 
 * If this is `true` (the default value), then we will also look in 
 * the `target.constructor` IF the `target` is an `object` and EITHER 
 * one of these is true:
 * 
 * - The specified `source` was NOT composed into the `target` directly.
 * - No `source` was specified, and the `target` has NO traits composed
 *   directly into itself.
 * 
 * Set this to `false` to only ever consider the `target` itself.
 * 
 * @returns {mixed} Return value depends on a few factors.
 * 
 * If NO traits have been composed into the `target`, always returns `null`.
 * 
 * If NO `source` argument was passed, then this will return a `Map` where
 * the keys will be a full set of `source` traits that have been composed, 
 * and each value will be a {@link module:@lumjs/core/traits~Composed} object.
 * 
 * If a `source` argument was passed, and that trait has been composed by
 * the `target` at least once (even if it has since been decomposed),
 * the return value will be the {@link module:@lumjs/core/traits~Composed}
 * object for the trait.
 * 
 * If the specified `source` trait has *never* been composed, returns `null`.
 * 
 * @throws {TypeError} If `target` is not valid.
 * 
 * @alias module:@lumjs/core/traits.getComposed
 */
function getComposed(target, source, tryClass=true)
{
  needObj(target, true,  'invalid target');

  let composed = null;

  if (target[COMPOSED_TRAITS] instanceof Map)
  {
    composed = target[COMPOSED_TRAITS];
  }

  if (composed)
  {
    if (!source)
    {
      return composed;
    }
    if (composed.has(source))
    { // Let's get definitions for a specific trait.
      return composed.get(source);
    }
  }

  if (tryClass && isObj(target))
  { // Try the class constructor.
    return getComposed(target.constructor, source);
  }

  return composed;
}

// Private function to initialize composed maps.
function mapComposed(target, source)
{
  if (!(target[COMPOSED_TRAITS] instanceof Map))
  {
    def(target, COMPOSED_TRAITS, {value: new Map()});
  }

  const forClass = isConstructor(target);
  const composed = {proto: null, static: null, forClass};
  target[COMPOSED_TRAITS].set(source, composed);
  return composed;
}

/**
 * Compose a trait into a target.
 * 
 * @param {(function|object)} target - Target to compose trait into.
 * 
 * Pass a class constructor function if you want to add properties
 * that will be available to every instance of the class.
 * 
 * Pass an object instance of you only want the properties added to
 * an individual object and not the class itself.
 * 
 * @param {(function|object)} source - Source trait to compose from.
 * 
 * Generally _should_ be the class constructor function of the Trait.
 * 
 * This _may_ be an object instance or prototype object, but that usage
 * is NOT generally recommended, and may lead to unforeseen side-effects.
 * 
 * @param {object} [opts] Options for what to compose, and how.
 * 
 * @param {(Array|function)} [opts.filter] Filter property names/symbols.
 * 
 * Only used if `.props` is NOT defined, this can be used to block
 * specific properties from being detected automatically.
 * 
 * Has absolutely no effect if the `.props` option is defined.
 * 
 * If it is a `function` it will be used by `Array#filter()` as a test
 * to determine the validity of property names/symbols.
 * 
 * If it is an `Array` the property names/symbols in the array
 * will **ignored/skipped** (i.e. a negative filter).
 * 
 * If not specified, the defaults depend on the `.static` option:
 * - If `.static` is `false` there is no default value.
 * - If `.static` is `true`, the default is to ignore all of the
 *   built-in properties `Object.getOwnPropertyNames()` returns on
 *   `function` values (which class constructors are), plus any
 *   of the static methods and getters from the `Trait` abstract class.
 * 
 * @param {object} [opts.props] A list of trait properties to compose.
 * 
 * May be a flat `Array` or a `Set` in which case the same keys are used 
 * for the both the source and target properties.
 * 
 * May be a `Map` or just a plain `object` whose enumerable properties
 * will be used as keys/value, where the key is the property name in
 * the source, and the value is the property name to use in the target.
 * 
 * If the target property is not a `string` or `Symbol`, then the source 
 * property key will be used. This makes it easy to rename some properties
 * but not others.
 * 
 * If omitted or set to any non-object value, we will get a list of
 * all properties defined on the `source`, by default using the
 * `Object.getOwnPropertyNames()` method.
 * 
 * @param {boolean} [opts.overwrite=false] Overwrite existing properties?
 * 
 * @param {boolean} [opts.static=false] Compose static properties?
 * 
 * - If `true` ONLY the *static* properties/methods will be composed.
 * - If `false` ONLY the *prototype* properties/methods will be composed.
 * 
 * In order to compose _both_ you'd need to call the function twice, 
 * or use the {@link module:@lumjs/core/traits.composeFully} function.
 * 
 * Only useful if `source` is a class constructor (always recommended).
 * The exact behaviour may be customized further with the `.flags` option.
 * 
 * Default is `false`.
 * 
 * @param {number} [opts.flags] Binary flags for advanced behaviours
 * 
 * The default `.flags` value, and the _ensure function_ used depends
 * on the value of the `.static` option:
 * 
 * | .static | Default | Ensure function                                     |
 * | ------- | ------- | --------------------------------------------------- |
 * | `false` | `3`     | {@link module:@lumjs/core/traits.ensureProto}       |
 * | `true`  | `0`     | {@link module:@lumjs/core/traits.ensureConstructor} |
 * 
 * The actual flags are fairly straightforward:
 * 
 * | Flag | Description                                                      |
 * | ---- | ---------------------------------------------------------------- |
 * | `1`  | Pass `target` through _ensure function_                          |
 * | `2`  | Pass `source` through _ensure function_                          |
 * 
 * @param {boolean} [opts.symbols=false] Auto-compose `Symbol` properties?
 * 
 * Calls `Object.getOwnPropertySymbols()` when generating a list of 
 * trait properties to compose.
 * 
 * Only used if `.props` is NOT defined; has no effect if `.props` is set.
 * 
 * Default is `false`.
 * 
 * @prop {boolean} [opts.strings=true] Auto-compose `string` properties?
 * 
 * Calls `Object.getOwnPropertyNames()` when generating a list of
 * trait properties to compose.
 * 
 * Only used if `.props` is NOT defined; has no effect if `.props` is set.
 * 
 * Default is `true`.
 * 
 * @returns {@link module:@lumjs/core/traits~Composed}
 * 
 * @throws {TypeError} If any of the arguments are not valid types.
 * 
 * @alias module:@lumjs/core/traits.compose
 */
function compose(specTarget, specSource, opts={})
{
  needObj(specSource, true,  'invalid source trait');
  needObj(opts,       false, 'invalid options object');

  const composedMaps 
    =  getComposed(specTarget, specSource) 
    ?? mapComposed(specTarget, specSource);

  const isStatic = opts.static ?? false; 
  const mapId = isStatic ? 'static' : 'proto';

  if (composedMaps[mapId])
  {
    console.warn(specSource, mapId, "already composed", specTarget, opts);
    return composedMaps;
  }

  const flags = parseInt(opts.flags) ?? (isStatic ? FLAGS_S : FLAGS_O);
  const ensure = isStatic ? ensureConstructor : ensureProto;

  const target = (flags & FLAG_ET) ? specTarget : ensure(specTarget);
  const source = (flags & FLAG_ES) ? specSource : ensure(specSource);

  let props  = opts.props;

  if (!isObj(props))
  { // No valid props specified, use all 'own' properties.
    const doStr = opts.strings ?? true,
          doSym = opts.symbols ?? false;

    props = doStr ? Object.getOwnPropertyNames(source) : [];

    if (doSym)
    { // Compose symbols as well.
      const symbols = Object.getOwnPropertySymbols(source);
      props.push(...symbols);
    }

    let filter = opts.filter ?? (isStatic ? IGNORE_STATIC : null);

    if (isArray(filter))
    { // Convert ignore into a filter function.
      const ignoreList = filter;
      filter = (p) => !ignoreList.includes(p);
    }

    if (typeof filter === F)
    {
      props = props.filter(filter);
    }
  }

  let sprops, tprops;

  if (isArray(props))
  { // A flat list of properties, use the same names.
    sprops = tprops = props;
  }
  else if (props instanceof Set)
  { // Almost identical to using an Array.
    sprops = tprops = Array.from(props.values());
  }
  else if (props instanceof Map)
  { // A structured Map of source name to dest name.
    sprops = Array.from(props.keys());
    tprops = Array.from(props.values());
  }
  else
  { // A plain object mapping.
    sprops = Object.keys(props);
    tprops = Object.values(props);
  }

  // A map to store the composed property info in.
  const composed = composedMaps[mapId] = new Map();

  for (const i in sprops)
  {
    let sprop = sprops[i];
    let tprop = tprops[i];

    const cdef = 
    {
      added: true,
      found: true,
    };

    if (!isProperty(sprop))
    { // Should never happen, but...
      sprop = sprop.toString();
    }

    if (tprop === '' || !isProperty(tprop))
    { // Use the source name as the target name.
      tprop = sprop;
    }

    cdef.id = tprop; // Ref to the target property here.

    if (sprop !== tprop)
    { // Source key differs, add a reference to it.
      cdef.srcKey = sprop;
    }

    const propDesc = getProp(source, sprop, null);
    cdef.newDescriptor = propDesc;

    if (!propDesc)
    { // No source property, that's weird.
      cdef.added = false;
      cdef.found = false;
    }
    else if (hasOwn(target, tprop))
    { // The target property already exists.
      if (opts.overwrite)
      { // Save the overwritten property descriptor.
        cdef.oldDescriptor = getProp(target, tprop);
      }
      else
      { // Not going to add it.
        cdef.added = false;
      }
    }

    if (cdef.added)
    { // (re-)define the target property.
      def(target, tprop, propDesc);
    }
    
    composed.set(tprop, cdef);
  }

  return composedMaps;
}

function getOpts(inOpts, isStatic)
{
  return Object.assign({}, inOpts, {static: isStatic});
}

/**
 * A wrapper around `compose()` that calls it twice.
 * 
 * - Once to compose *prototype* properties.
 * - Then to compose *static* properties.
 * 
 * While the `target` and `source` arguments _can_ be specified
 * as `object` values, for the purposes of this function it makes
 * the most sense to pass class constructor `function` values.
 * The behaviour if `object` values are passed is *undefined* and
 * *untested*, and the rest of the function documentation assumes 
 * only `function` values will be passed.
 * 
 * @param {function} target - Target class
 * @param {function} source - Source trait
 * 
 * @param {object} [protoOpts] Options for the *prototype* call.
 * 
 * Compiled options will have `static` option forced to `false`.
 * 
 * @param {object} [staticOpts] Options for the *static* call.
 * 
 * Compiled options will have `static` option forced to `true`.
 * 
 * @param {boolean} [reverse=false] Reverse order of composing?
 * 
 * If `true` then *static* properties will be composed first,
 * followed by *prototype* properties.
 * 
 * @returns {@link module:@lumjs/core/traits~Composed}
 * 
 * Will have both `proto` and `static` properties set.
 * 
 * @see module:@lumjs/core/traits.compose
 * @alias module:@lumjs/core/traits.composeFully
 */
function composeFully(target, source, protoOpts, staticOpts, reverse=false)
{
  const OPR = getOpts(protoOpts, false);
  const OST = getOpts(staticOpts, true);
  const ALL = reverse ? [OST,OPR] : [OPR,OST];

  let composed;

  for (const opts of ALL)
  {
    composed = compose(target, source, opts);
  }
  
  return composed;
}

/**
 * Decompose (remove) a trait from a target.
 * 
 * Applicable properties that were added to the `target` will be removed.
 * 
 * If an existing property was overwritten when the trait was composed, 
 * the original property will be restored.
 * 
 * @param {(function|object)} target - Target to decompose trait from.
 * @param {(function|object)} source - Source trait we are decomposing.
 * 
 * @param {object} [opts] Options
 * @param {boolean} [opts.static] Decompose only a subset of properties?
 * 
 * - If `true` ONLY *static* properties will be decomposed.
 * - If `false` ONLY *prototype* properties will be decomposed.
 * - If omitted **ALL** properties will be decomposed!
 * 
 * @returns {number} Number of properties decomposed.
 */
function decompose(specTarget, specSource, opts={})
{
  const isStatic = opts.static

  let c = 0;

  if (typeof isStatic !== B)
  { // The default is to remove all composed properties.
    c += decompose(specTarget, specSource, getOpts(opts, true));
    c += decompose(specTarget, specSource, getOpts(opts, false));
    return c;
  }

  const composedMaps = getComposed(specTarget, specSource);
  const mapId = isStatic ? 'static' : 'proto';
  if (composedMaps && composedMaps[mapId] instanceof Map)
  { // Found a valid map.
    const composed = composedMaps[mapId];
    const target = isStatic ? specTarget : ensureProto(specTarget);

    for (const [prop,spec] of composed)
    {
      if (spec.added)
      {
        if (spec.oldDescriptor)
        { // An old descriptor to restore.
          def(target, prop, spec.oldDescriptor);
        }
        else
        { // Just delete the added property descriptor.
          delete target[prop];
        }
        c++; // Increment the counter.
      }
    } // for composed

    // Now remove the property map itself.
    composedMaps[mapId] = null; 
  }

  return c;
}

module.exports = 
{
  compose, composeFully, getComposed, decompose,
  IGNORE_STATIC, ensureProto, ensureConstructor,  
  // Undocumented:
  hasOwn,
}
