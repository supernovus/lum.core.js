
// Get some constants
const {S,B,N,F,isObj,isArray,needObj,def} = require('../types');
const {copyAll, duplicateOne: clone} = require('./copyall');

const RECURSE_NONE =  0;
const RECURSE_ALL  = -1;
const RECURSE_LIST = -2;

/**
 * Copy properties from one object to another.
 *
 * @param {(object|function)} source - The object to copy properties from.
 * @param {(object|function)} target - The target to copy properties to.
 *
 * @param {object} [opts] Options for how to copy properties.
 * @param {boolean} [opts.default=true] Copy only enumerable properties.
 * @param {boolean} [opts.all=false] Copy ALL object properties.
 * @param {Array} [opts.props] A list of specific properties to copy.
 * @param {Array} [opts.exclude] A list of properties NOT to copy.
 * @param {object} [opts.overrides] Descriptor overrides for properties.
 * 
 * The object is considered a map, where each *key* is the name of the
 * property, and the value should be an `object` containing any valid
 * descriptor properties.
 * 
 * If `opts.default` is explicitly set to `false` and `opts.overrides` 
 * is set, then not only will it be used as a list of overrides, 
 * but only the properties specified in it will be copied.
 * 
 * @param {*} [opts.overwrite=false] Overwrite existing properties.
 * 
 * If this is a `boolean` value, it will allow or disallow overwriting
 * of any and all properties in the target object.
 *
 * If this is an `object`, it can be an `Array` of property names to allow
 * to be overwritten, or a *map* of property name to a `boolean` indicating
 * if that property can be overwritten or not.
 * 
 * Finally, if this is a `function` it'll be passed the property name and
 * must return a boolean indicating if overwriting is allowed.
 * 
 * @param {number} [opts.recursive=0] Enable recursive copying of objects.
 * 
 * If it is `0` (also `copyProps.RECURSE_NONE`) then no recursion is done.
 * In this case, the regular assignment rules (including `opts.overwrite`)
 * will be used regardless of the property type. 
 * This is the default value.
 * 
 * If this is *above zero*, it's the recursion depth for `object` properties.
 * 
 * If this is *below zero*, then it should be one of the constant values:
 * 
 * | Contant                  | Value | Description                          |
 * | ------------------------ | ----- | ------------------------------------ |
 * | `copyProps.RECURSE_ALL`  | `-1`  | Recurse to an *unlimited* depth.     |
 * | `copyProps.RECURSE_LIST` | `-2`  | Recurse `opts.recurseOpts` props.    |
 * 
 * @param {object} [opts.recurseOpts] Options for recursive properties.
 * 
 * If `opts.recursive` is not `0` then `opts.recurseOpts` can be a map of
 * property names to further objects, which will be used as the `opts` for
 * that property when calling `copyProps()` recursively.
 * 
 * So you could have nested `opts.recurseOpts` values if required.
 * 
 * The `recursive` property will automatically be added to the individual
 * `recurseOpts`, automatically applying the correct value.
 * 
 * The `opts.recurseOpts` option has an extra-special meaning if `opts.recurse`
 * is set to `RECURSE_LIST`, as then *only* the properties with options defined
 * in `opts.recurseOpts` will be recursed. The rest will simply be copied.
 *
 * @returns {object} The `target` object.
 * @alias module:@lumjs/core/obj.copyProps
 */
function copyProps(source, target, opts={})
{
  //console.debug("copyProps", source, target, propOpts);
  needObj(source, true, 'source must be an object or function');
  needObj(target, true, 'target must be an object or function');
  needObj(opts, false, 'opts must be an object');

  const useDefaults = opts.default   ?? true;
  const overrides   = opts.overrides ?? {};
  
  let recursive;
  if (typeof opts.recursive === N)
  {
    recursive = opts.recursive;
  }
  else if (typeof opts.recursive === B)
  {
    recursive = opts.recursive ? RECURSE_ALL : RECURSE_NONE;
  }
  else 
  {
    recursive = RECURSE_NONE;
  }

  let recurseCache, recurseOpts;
  if (recursive !== RECURSE_NONE)
  {
    recurseCache = opts.recurseCache ?? [];
    recurseOpts  = opts.recurseOpts  ?? {};
  }

  let overwrites;
  if (typeof opts.overwrite === F)
  { // A custom function.
    overwrites = opts.overwrite;
  }
  else if (isObj(opts.overwrite))
  { // An object may be an array or a map.
    if (isArray(opts.overwrite))
    { // A flat array of properties to overwrite.
      overwrites = prop => opts.overwrite.includes(prop);
    }
    else 
    { // A map of properties to overwrite.
      overwrites = prop => opts.overwrite[prop] ?? false;
    }
  }
  else 
  { // The only other values should be boolean.
    overwrites = () => opts.overwrite ?? false;
  }

  const exclude = isArray(opts.exclude) ? opts.exclude : null;

  let propDefs;

  if (isArray(opts.props))
  {
    propDefs = opts.props;
  }
  else if (opts.all)
  {
    propDefs = Object.getOwnPropertyNames(source); 
  }
  else if (useDefaults)
  {
    propDefs = Object.keys(source);
  }
  else
  {
    propDefs = Object.keys(overrides);
  }

  if (!propDefs)
  {
    console.error("Could not determine properties to copy", opts);
    return;
  }

  // For each propDef found, add it to the target.
  for (const prop of propDefs)
  {
    //console.debug(" @prop:", prop);
    if (exclude && exclude.indexOf(prop) !== -1)
    { // Excluded property.
      continue;
    }

    let desc = Object.getOwnPropertyDescriptor(source, prop);
    //console.debug(" @desc:", def);
    if (desc === undefined) 
    { // A non-existent property.
      continue; // Invalid property.
    }

    if (isObj(overrides[prop]))
    { // Overriding descriptor properties.
      desc = clone(desc);
      for (const key in overrides[prop])
      {
        const val = overrides[prop][key];
        desc[key] = val;
      }
    }

    let overwrite = overwrites(prop);

    if (recursive !== 0 
      && (recursive !== RECURSE_LIST || isObj(recurseOpts[prop]))
      && isObj(desc.value) 
      && isObj(target[prop])
      && !recurseCache.includes(desc.value) 
      && !recurseCache.includes(target[prop]))
    { // Recursive mode is enabled, so we're going to go deeper.
      recurseCache.push(decs.value);
      if (desc.value !== target[prop])
      { // They're not the same literal object already.
        recurseCache.push(target[prop]);
        const ropts 
          = isObj(recurseOpts[prop]) 
          ? clone(recurseOpts[prop]) 
          : {overwrite};
        // Always set the cache.
        ropts.recurseCache = recurseCache;
        if (typeof ropts.recursive !== N)
        { // Set the recursive option.
          ropts.recursive = (recursive > 0) ? recursive - 1 : recursive;
        }
        // Okay, we're ready, let's recurse now!
        copyProps(desc.value, target[prop], ropts);
      }
    }
    else if (overwrite || target[prop] === undefined)
    { // Property doesn't already exist, let's add it.
      def(target, prop, desc);
    }
  }

  //console.debug("copyProps:done", target);

  return target;
} // copyProps()

def(copyProps, 'RECURSE_NONE', RECURSE_NONE);
def(copyProps, 'RECURSE_ALL',  RECURSE_ALL);
def(copyProps, 'RECURSE_LIST', RECURSE_LIST);

/**
 * A class providing a declarative `copyProps()` API,
 * which makes it easy to copy one or more sources,
 * into one or more targets.
 * 
 * This class is not directly accessible, and instead is available
 * via some special sub-methods of `copyProps`; examples:
 * 
 * ```js
 * // Get a copy of the `copyProps` function.
 * const cp = require('@lumjs/core').obj.copyProps;
 * 
 * // Starting with the target(s):
 * cp.into(targetObj).given({all: true}).from(source1, source2);
 * 
 * // Starting with the source(s):
 * cp.from(sourceObj).given({exclude: ['dontCopy']}).into(target1, target2);
 * 
 * // Starting with the options:
 * cp.given({recursive: cp.RECURSE_ALL}).from(source1, source2).into(target1, target2);
 * 
 * // Call `cp.into()` and cache the instance in a `Map`.
 * // Future calls with the same `targetObj` will return the cached instance.
 * // Unlike `cp.into()`, only supports a single `targetObj`.
 * cp.cache.into(targetObj);
 *
 * // Call `cp.from()` and cache the instance in a `Map`.
 * // Future calls with the same `sourceObj` will return the cached instance.
 * // Unlike `cp.from()`, only supports a single `sourceObj`.
 * cp.cache.from(sourceObj);
 * 
 * // Clear the `Map` instances for `cp.cache.into` and `cp.cache.from`
 * cp.cache.clear();
 *
 * ```
 * 
 * @alias module:@lumjs/core/obj~CopyProps
 */
class $CopyProps
{
  // Constructor is private so we won't document it.
  constructor(opts={})
  {
    this.opts = opts;
    this.sources = [];
    this.targets = [];
  }

  /**
   * Set options.
   * 
   * @param {(string|object)} opt - Option(s) to set.
   * 
   * If this is a `string` it's the name of an option to set.
   * If this is an `object`, it's map of options to set with `copyAll`.
   * 
   * @param {*} value - The option value.
   * 
   * Only used if `option` is a `string`.
   * 
   * @returns {object} `this`
   */
  set(opt, value)
  {
    //console.debug("CopyProps.set(", opt, value, ')');
    if (typeof opt === S)
    { // Set a single option.
      this.opts[opt] = value;
    }
    else if (isObj(opt))
    { // Set a bunch of options.
      copyAll(this.opts, opt);
    }
    else
    { // That's not supported
      console.error("invalid opt", {opt, value, cp: this});
    }
    //console.debug("CopyProps.set:after", this);
    return this;
  }

  /**
   * Set all options.
   * 
   * This replaces any existing options entirely.
   * 
   * @param {object} opts - The options to set.
   * @returns {object} `this`
   */
  given(opts)
  {
    needObj(opts);
    this.opts = opts;
    return this;
  }

  /**
   * Specify the `targets` to copy properties into.
   * 
   * @param {...object} [targets] The target objects
   * 
   * If `this.sources` has objects in it already,
   * then we'll run `copyProps()` for each of the 
   * sources into each of the `targets`.
   * 
   * If `this.sources` is empty, then this will set
   * `this.target` to the specified value.
   * 
   * You can specify no sources at all to clear the 
   * currently set `this.targets` value.
   * 
   * @returns {object} `this`
   */
  into(...targets)
  {
    if (this.sources.length > 0 && targets.length > 0)
    {
      this.$run(this.sources, targets);
    }
    else 
    {
      this.targets = targets;
    }
    return this;
  }

  /**
   * Specify the `sources` to copy properties from.
   * 
   * @param  {...object} [sources] The source objects.
   * 
   * If `this.targets` has objects in it already, 
   * then we'll run `copyProps()` for each of the 
   * `sources` into each of the targets.
   * 
   * If `this.targets` is empty, then this will set
   * `this.sources` to the specified value.
   * 
   * You can specify no sources at all to clear the 
   * currently set `this.sources` value.
   * 
   * @returns {object} `this`
   */
  from(...sources)
  {
    if (this.targets.length > 0 && sources.length > 0)
    {
      this.$run(sources, this.targets);
    }
    else 
    {
      this.sources = sources;
    }
    return this;
  }

  // Protected method doesn't need to be documented.
  $run(sources, targets)
  {
    for (const source of sources)
    {
      for (const target of targets)
      {
        copyProps(source, target, this.opts);
      }
    }
  }

}

copyProps.given = function(opts)
{
  return new $CopyProps(opts);
}

copyProps.into = function(...targets)
{
  return ((new $CopyProps()).into(...targets));
}

copyProps.from = function(...sources)
{
  return ((new $CopyProps()).from(...sources));
}

copyProps.cache =
{
  into(target)
  {
    if (this.intoCache === undefined)
      this.intoCache = new Map();
    const cache = this.intoCache;
    if (cache.has(target))
    {
      return cache.get(target);
    }
    else
    {
      const cp = copyProps.into(target);
      cache.set(target, cp);
      return cp;
    }
  },
  from(source)
  {
    if (this.fromCache === undefined)
      this.fromCache = new Map();
    const cache = this.fromCache;
    if (cache.has(source))
    {
      return cache.get(source);
    }
    else
    {
      const cp = copyProps.from(source);
      cache.set(source, cp);
      return cp;
    }
  },
  clear()
  {
    if (this.intoCache)
      this.intoCache.clear();
    if (this.fromCache)
      this.fromCache.clear();
    return this;
  },
};

module.exports = copyProps;
