/**
 * A very simplistic Trait system.
 * @module @lumjs/core/traits
 */

"use strict";

const getProp = require('./obj/getproperty');

const 
{
  def,F,B,
  isObj,isArray,isConstructor,isProperty,
  needObj,
} = require('./types');

// Symbol for private storage of composed traits.
const COMPOSED_TRAITS = Symbol.for('@lumjs/core/traits~ComposedTraits');

// Protected function to get a class prototype.
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
    throw new TypeError("Invalid class constructor or object instance");
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
  'composeInto', 'setupTrait', 'getComposed', 'decomposeFrom', 'removeTrait',
  // Optional static getter properties for the Trait abstract class.
  'composeOptions', 'staticOptions',
];

/**
 * Get a composed definition list.
 * 
 * @param {(function|object)} target - Target to look in.
 * @param {(function|object)} [source] Source trait to get defs for.
 * 
 * @returns {mixed} Return value depends on a few factors.
 * 
 * If NO traits have been composed into the `target`, returns `null`.
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
 * If the specified `source` trait has *never* been composed, but at least
 * one other trait has been, this will return `undefined`.
 * 
 * @throws {TypeError} If `target` is not valid.
 * 
 * @alias module:@lumjs/core/traits.getComposed
 */
function getComposed(target, source)
{
  needObj(target, true,  'invalid target');

  let composed = null;

  if (target[COMPOSED_TRAITS] instanceof Map)
  {
    composed = target[COMPOSED_TRAITS];
  }
  else if (isObj(target))
  {
    return getComposed(target.constructor, source);
  }

  if (composed && source)
  { // Let's get definitions for a specific trait.
    return composed.get(source);
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

  const composed = {proto: null, static: null};
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
 * 
 * Default is `false`.
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

  const target = isStatic ? specTarget : ensureProto(specTarget);
  const source = isStatic ? specSource : ensureProto(specSource);

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

  composedMaps[mapId] = composed;
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

/**
 * An abstract class for Traits.
 * 
 * Simply offers a couple static methods and APIs that
 * wrap the `compose()` and `composeFully()` functions,
 * and makes it fairly simple to create Trait classes.
 * 
 * @alias module:@lumjs/core/traits.Trait
 */
class CoreTrait
{
  /**
   * Extend another class or object instance with the methods and
   * getter/setter properties from a Trait.
   * 
   * The sub-class of Trait this static method is called on will always 
   * be the `source` argument.
   * 
   * @param {(function|object)} target - Target class or instance.
   * 
   * @param {object} [protoOpts] Options for `compose()` function.
   * 
   * If this is not specified, or is any value other than an `object`,
   * we will look for defaults in a `composeOptions` static property:
   * 
   * ```js
   * static get composeOptions() { return {your: default, options: here}; }
   * ```
   * 
   * @param {(object|true)} [staticOpts] Static options.
   * 
   * If this is set we'll use `composeFully()` instead of using `compose()`.
   * 
   * If this value is an `object` it will be used as the `staticOpts`.
   * 
   * If this is the special value `true`, then we will look for the options
   * in a `staticOptions` static property:
   * 
   * ```js
   * static get staticOptions() { return {your: static, options: here}; }
   * ```
   * 
   * If this any value other than an `object` or `true`, it will be ignored
   * entirely, and the regular `compose()` call will be used.
   * 
   * @returns {object} Return value from the `setupTrait()` static method.
   * 
   */
  static composeInto(target, protoOpts, staticOpts)
  {
    if (!isObj(protoOpts))
    {
      protoOpts = this.composeOptions ?? {};
    }

    if (staticOpts === true)
    {
      staticOpts = this.staticOptions ?? {};
    }

    let composed;

    if (isObj(staticOpts))
    {
      composed = composeFully(target, this, protoOpts, staticOpts);
    }
    else
    {
      composed = compose(target, this, protoOpts);
    }

    return this.setupTrait({target, protoOpts, staticOpts, composed});
  }

  /**
   * A static method called by `composeInto()`
   * _after_ composing the trait properties into the target.
   * 
   * @param {object} info - Metadata from `composeInto()`
   * @param {(function|object)} info.target - The `target` argument
   * @param {object} info.protoOpts - The `protoOpts` used
   * @param {object} [info.staticOpts] The `staticOpts` if used
   * @param {module:@lumjs/core/traits~Composed} info.composed 
   * The return value from `compose()` or `composeFully()`.
   * 
   * @returns {object} The `info` object, with any changes made
   * by an overridden `setupTrait()` method in the sub-class.
   * 
   * The default implementation is a placeholder that returns the
   * `info` object without making any changes.
   * 
   */
  static setupTrait(info)
  {
    if (this.debug)
    {
      console.debug(this.name, "setupTrait()", info, this);
    }
    return info;
  }

  /**
   * A method wrapping {@link module:@lumjs/core/traits.decompose}
   * where the `source` is always the Trait sub-class constructor.
   * 
   * See the `decompose()` docs for descriptions of the other arguments.
   * 
   * @param {(function|object)} target 
   * @param {object} [opts] 
   * @returns {object} Return value from the `removeTrait()` static method.
   */
  static decomposeFrom(target, opts)
  {
    const info = {target};
    info.composed = this.getComposed(target);
    info.count = decompose(target, this, opts);
    return this.removeTrait(info);
  }

  /**
   * A static method called by `decomposeFrom()`
   * _after_ decomposing the trait properties from the target.
   * 
   * @param {object} info - Metadata from `decomposeFrom()`
   * @param {(function|object)} info.target - The `target` argument
   * @param {module:@lumjs/core/traits~Composed} info.composed 
   * The property map that was previously composed.
   * @param {number} info.count - The number of properties decomposed.
   * 
   * @returns {object} The `info` object, with any changes made
   * by an overridden `removeTrait()` method in the sub-class.
   * 
   * The default implementation is a placeholder that returns the
   * `info` object without making any changes.
   * 
   */
  static removeTrait(info)
  {
    if (this.debug)
    {
      console.debug(this.name, "removeTrait()", info, this);
    }
    return info;
  }  

  /**
   * A method wrapping {@link module:@lumjs/core/traits.getComposed}
   * where the `source` is always the Trait sub-class constructor.
   * 
   * @param {(function|object)} target
   * @returns {mixed} Return value from `getComposed()`
   */
  static getComposed(target)
  {
    return getComposed(target, this);
  }

} // CoreTrait class

module.exports = 
{
  // The main public exports.
  compose, composeFully, getComposed, decompose,
  Trait: CoreTrait, IGNORE_STATIC,

  // Undocumented protected functions.
  ensureProto, hasOwn,
}

/**
 * Composed property maps.
 * 
 * @typedef {object} module:@lumjs/core/traits~Composed
 * 
 * @prop {?Map} proto  - Map of composed *prototype* properties.
 * 
 * Keys are the `string` or `symbol` for each composed property.
 * Values are {@link module:@lumjs/core/traits~ComposedProperty} objects.
 * 
 * If no applicable trait properties are currently composed,
 * this will be `null`.
 * 
 * @prop {?Map} static - Map of composed *static* properties.
 * 
 * Exactly the same description as `proto`, but for static properties.
 * 
 */

/**
 * Composed property definitions.
 * 
 * @typedef {object} module:@lumjs/core/traits~ComposedProperty
 * 
 * @prop {(string|Symbol)} id - The property key on the `target`
 * @prop {(string|Symbol)} [srcKey] The property key from the `source`;
 * only included if different from `propKey`.
 * 
 * @prop {?object} newDescriptor - The property descriptor to be added;
 * will be `null` if the property did not exist.
 * 
 * @prop {object} [oldDescriptor] The replaced property descriptor;
 * only included if there was an existing property in the `target` 
 * and the `opts.overwrite` option was `true`.
 * 
 * @prop {boolean} found - Was the property found in the `source` ?
 * @prop {boolean} added - Was the property added to the `target` ?
 * 
 */
