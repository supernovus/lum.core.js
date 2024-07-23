/**
 * Functions for working with options and default values.
 * @module @lumjs/core/opt
 */

const 
{
  U,F,S,N,B,
  isObj,isComplex,isArray,isNil,needObj,needType
} = require('./types');
const {insert} = require('./arrays/add');
const {getObjectPath} = require('./obj/ns');

// Aliases for Opts#get() and Opts#find()
const OPTS_ALIASES =
{
  'null': 'allowNull',
  'lazy': 'isLazy',
}

/**
 * A helper to support both positional arguments and named
 * options in the same method signature.
 *
 * @param {object} opts - Options built from positional arguments
 * 
 * Keep in mind that this object **WILL** be modified!
 * 
 * @param {string} optArg - The option that may contain named options
 * 
 * Generally the name of the first positional argument that may be
 * an `object` full of options or a different positional argument value.
 * 
 * The biggest limitation is that it cannot be an `object` value when used
 * as a positional argument, as that will always be seen as the _options_.
 * 
 * @param {*} optDef - A default value for `opts[optArg]`
 * 
 * If `opts[optArg]` was an `object`, we'll compose its properties
 * into `opts` directly. If after that `opts[optArg]` is still the
 * options `object` then this value will be used instead.
 * 
 * @param {boolean} [validate=true] Ensure `opts` is an object?
 * 
 * Should only be disabled if you know for certain it is.
 * 
 * @example <caption>Example usage</caption>
 * 
 *   function example(first=true, second=null, third="test")
 *   {
 *     const opts = argOpts({first, second, third}, 'first', true);
 *   }
 * 
 * @alias module:@lumjs/core/opt.argOpts
 */
function argOpts(opts, optArg, optDef, validate=true)
{
  if (validate) needObj(opts, false, 'invalid opts object');

  if (isObj(opts[optArg]))
  { // Merge the named options.
    const specOpts = opts[optArg];
    Object.assign(opts, specOpts);
    if (opts[optArg] === specOpts)
    { // specOpts didn't override the real option.
      opts[optArg] = optDef;
    }
  }

} // argOpts()

exports.argOpts = argOpts;

// Private helper for `val()` and `get()` to support new-style options.
function _opts(opts, defNull)
{
  return argOpts(opts, 'allowNull', defNull, false);
}

/**
 * See if a value is *set*, and if not, return a default value.
 * 
 * This function used to use all positional arguments, but it now
 * supports named options if an `object` is passed as the third argument.
 * If both named options and the corresponding positional arguments are
 * specified, the named options will take precedence.
 *
 * @param {*} optvalue - The value we are testing.
 * @param {*} defvalue - The default value if opt was null or undefined.
 * 
 * @param {(object|boolean)} opts - Options
 * 
 * If this is a `boolean` it is used as the `allowNull` option.
 *
 * @param {boolean} [opts.allowNull=false] If true, allow null to count as *set*.
 * @param {boolean} [opts.isLazy=false] If true, and `defvalue` is a function,
 *                                      use the value from the function as 
 *                                      the default.
 * @param {object} [opts.lazyThis=null] If `isLazy` is true, this object will
 *                                      be used as `this` for the function.
 * @param {Array}  [opts.lazyArgs] If `isLazy` is true, this may be used
 *                                 as a list of arguments to pass.
 * 
 * @param {boolean} [isLazy=false]  Same as `opts.isLazy`
 * @param {object}  [lazyThis=null] Same as `opts.lazyThis`
 * @param {Array}   [lazyArgs]      Same as `opts.lazyArgs`
 *
 * @return {*} Either `optvalue` or `defvalue` depending on the test.
 * @alias module:@lumjs/core/opt.val
 */
function val(optvalue, defvalue, 
  allowNull=false, 
  isLazy=false, 
  lazyThis=null,
  lazyArgs=[])
{
  const opts = _opts({allowNull,isLazy,lazyThis,lazyArgs}, false);

  if (typeof optvalue === U || (!opts.allowNull && optvalue === null))
  { // The defined value was not "set" as per our rules.
    if (opts.isLazy && typeof defvalue === F)
    { // Get the default value from a passed in function.
      return defvalue.apply(opts.lazyThis, opts.lazyArgs);
    }
    return defvalue;
  }

  return optvalue;
}

exports.val = val;

/**
 * See if a property in an object is set.
 *
 * If it is, return the property, otherwise return a default value.
 * This uses the `val()` method, and as such supports the same arguments.
 * However read the descriptions, as defaults may be quite different!
 *
 * @param {object} obj      - An object to test for a property in.
 * @param {string} optname  - The property name we're checking for.
 * @param {*}      defvalue - The default value.
 *
 * @param {(object|boolean)} [opts] Options
 * 
 * If this is a `boolean` it is used as the `allowNull` option.
 * 
 * @param {boolean} [opts.allowNull=true] Passed to `val()`;
 * default is `true`, which differs from `val()`.
 * @param {boolean} [opts.isLazy=false] Passed to `val()`;
 * default is `false`, the same as `val()`.
 * @param {object}  [opts.lazyThis=obj] Passed to `val()`;
 * default is `obj`, which differs from `val()`.
 * @param {Array}   [opts.lazyArgs] Passed to `val()`
 * @param {boolean} [opts.allowFun=false] Allow `obj` to be a `function` ?
 * 
 * By default only `object` values are valid for `obj`; this can be set to
 * `true` to allow `function` values to be used.
 * 
 * @param {boolean} [isLazy=false]   Same as `opts.isLazy`
 * @param {object}  [lazyThis=opts]  Same as `opts.lazyThis`
 * @param {Array}   [lazyArgs]       Same as `opts.lazyArgs`
 * @param {boolean} [allowFun]       Same as `opts.allowFun`
 *
 * @returns {*} Either the property value, or the default value.
 * @see module:@lumjs/core/opt.val
 * @alias module:@lumjs/core/opt.get
 */
function get(obj, optname, defvalue, 
  allowNull=true, 
  isLazy=false, 
  lazyThis=obj,
  lazyArgs=[],
  allowFun=false)
{
  const opts = _opts({allowNull,isLazy,lazyThis,lazyArgs,allowFun}, true);

  needObj(obj, opts.allowFun);
  needType(S, optname);

  return val(obj[optname], defvalue, 
    opts.allowNull, 
    opts.isLazy, 
    opts.lazyThis, 
    opts.lazyArgs);
}

exports.get = get;

/**
 * An alternative to `get()` that uses `getObjectPath()`
 * to look for a specific nested property value.
 * 
 * While `get()` supports positional arguments like `val()`, 
 * this function _only_ supports named options.
 * 
 * @param {object} obj - Object we're looking for properties in
 * @param {(string|Array)} path - Path for `getObjectPath()`
 * @param {object} [opts] Options
 * 
 * This supports all of the same options as `get()`, plus all of the
 * options supported by `getObjectPath()`. See the docs for both those
 * functions to see what all is supported. If the same option is supported
 * by *both* functions (e.g. `allowFun`) then the default value 
 * will be the one from `getObjectPath()` rather than `get()`.
 * 
 * @param {boolean} [opts.ro=false] Should `opts` be read-only?
 * 
 * If `true`, a copy of the `opts` will be made before any changes
 * are performed, ensuring the original options aren't modified.
 * 
 * @returns {*} The property if found, or `opts.default` if not.
 * 
 * @see module:@lumjs/core/opt.get
 * @see module:@lumjs/core/obj.getObjectPath
 * @alias module:@lumjs/core/opt.getPath
 */
function getPath(obj, path, opts={})
{
  const defvalue = opts.default;
  if (opts.ro)
  {
    opts = Object.assign({}, opts);
  }
  delete opts.default;
  
  return val(getObjectPath(obj, path, opts), defvalue,
    (opts.allowNull ?? true),
    opts.isLazy,
    (opts.lazyThis ?? obj),
    opts.lazyArgs);
}

exports.getPath = getPath;

/**
 * A class for handling options with multiple sources.
 * @alias module:@lumjs/core/opt.Opts
 */
class Opts
{
  /**
   * Build an Opts instance.
   * 
   * @param  {...object} sources - Initial sources of options.
   * 
   * The order of sources matters, as the ones added later will override
   * the ones added earlier. Keep that in mind when adding sources.
   */
  constructor(...sources)
  {
    this.$sources = [];
    this.$curPos = -1;
    this.$curSrc = null;

    this.$fatalErrors = false;
    this.$strictProps = false;

    this.add(...sources);
  }

  static isPath(value)
  {
    return (Array.isArray(value) 
    || (typeof value === S && value.includes('.')));
  }

  /**
   * Compile current sources into a data object.
   * 
   * @returns {object} `this`
   * @private
   */
  _compile()
  {
    this.$data = Object.assign({}, ...this.$sources);
    return this;
  }

  /**
   * Handle an error
   * 
   * @param {string} msg - A summary of the error.
   * @param {object} info - Debugging information for the logs.
   * @param {function} [errClass=TypeError] Constructor for an `Error` class.
   * Used if fatal errors are enabled.
   * 
   * @returns {object} `this`
   * @throws {Error} An error of `errClass` class, if fatal mode is enabled.
   * @private
   */
  _err(msg, info={}, errClass=TypeError)
  {
    const args = this.$fatalErrors ? [info] : [msg, info];

    info.instance = this;
    console.error(...args);

    if (this.$fatalErrors)
    {
      throw new errClass(msg);
    }
  }

  /**
   * Normalize options.
   * 
   * Auto-sets `isLazy` if it wasn't specified.
   * Applies any known aliases.
   * 
   * @param {object} opts - Options to normalize
   * @returns {object} Usually `opts`, but might be a copy.
   * @private
   */
  _opts(opts)
  {
    if (opts._opts_compiled)
    { // Already done.
      return opts;
    }

    if (opts.ro)
    {
      opts = Object.assign({}, opts);
    }

    if (isNil(opts.isLazy)
      && (isComplex(opts.lazyThis) 
      || isArray(opts.lazyArgs)))
    {
      opts.isLazy = true;
    }

    for (const akey in OPTS_ALIASES)
    {
      const okey = OPTS_ALIASES[akey];
      if (opts[okey] === undefined && opts[akey] !== undefined)
      { // An alias was found.
        opts[okey] = opts[akey];
      }
    }

    // Now remember that we've processed these options.
    opts._opts_compiled = true;
    return opts;
  }

  /**
   * Set the fatal error handling setting.
   * 
   * Default is `false`, so errors will be logged, but not thrown.
   * 
   * @param {boolean} val - Should errors be fatal?
   * @returns {object} `this`
   */
  fatal(val)
  {
    if (typeof val === B)
    {
      this.$fatalErrors = val;
    }
    else
    {
      this._err('invalid fatal value', {val});
    }

    return this;
  }

  /**
   * Set the strict property check setting.
   * 
   * Default is `false`, we don't care about non-existent properties. 
   *
   * @param {boolean} val - Should non-existant properties be an error?
   * @returns {object} `this`
   */
  strict(val)
  {
    if (typeof val === B)
    {
      this.$strictProps = val;
    }
    else
    {
      this._err('invalid strict value', {val});
    }

    return this;
  }

  /**
   * Set the position/offset to add new sources at.
   * 
   * This will affect subsequent calls to the `add()` method.
   * 
   * @param {number} pos - The position/offset value.
   * 
   * - A value of `-1` uses `Array#push(src))`; end of array.
   * - A value of `0` uses `Array#unshift(src)`; start of array.
   * - Any value `> 0` uses `Array#splice(pos, 0, src)`; offset from start.
   * - Any value `< -1` uses `Array#splice(pos+1, 0, src)`; offset from end.
   * 
   * The default value if none is specified is `-1`.
   * 
   * @returns {object} `this`
   * @throws {TypeError} An invalid value was passed while `fatal` was true.
   */
  at(pos)
  {
    if (typeof pos === N)
    {
      this.$curPos = pos;
    }
    else
    {
      this._err("Invalid pos value", {pos});
    }
    
    return this;
  }

  /**
   * Set the object to look for nested properties in.
   * 
   * This will affect subsequent calls to the `add()` method.
   * 
   * @param  {(object|number|boolean)} source - Source definition
   *
   * - If this is an `object` it will be used as the object directly.
   * - If this is a `number` it is the position of one of our data sources.
   *   Negative numbers count from the end of the list of sources.
   * - If this is `true` then the compiled options data at the time of the
   *   call to this method will be used.
   * - If this is `false` then the next time a `string` value is passed to
   *   `add()` the options will be compiled on demand, and that object will
   *   be used until the next call to `from()`.
   * 
   * If this is not specified, then it defaults to `false`.
   *
   * @returns {object} `this`
   * @throws {TypeError} An invalid value was passed while `fatal` was true.
   */
  from(source)
  {
    if (source === true)
    { // Use existing data as the source.
      this.$curSrc = this.$data;
    }
    else if (source === false)
    { // Auto-generate the source the next time.
      this.$curSrc = null;
    }
    else if (typeof source === N)
    { // A number will be the position of an existing source.
      const offset 
        = (source < 0)
        ? this.$sources.length + source
        : source;

      if (isObj(this.$sources[offset]))
      {
        this.$curSrc = this.$sources[offset];
      }
      else
      {
        this._err("Invalid source offset", {offset, source});
      }
    }
    else if (isObj(source))
    { // An object or function will be used as the source.
      this.$curSrc = source;
    }
    else
    {
      this._err("Invalid source", {source});
    }

    return this;
  } 

  /**
   * Add new sources of options.
   * 
   * @param  {...(object|string)} sources - Sources and positions.
   * 
   * If this is an `object` then it's a source of options to add.
   * This is the most common way of using this.
   * 
   * If this is a `string` then it's assumed to be nested property
   * of the current `from()` source, and if that property exists and
   * is an object, it will be used as the source to add. If it does
   * not exist, then the behaviour will depend on the values of the
   * `strict()` and `fatal()` modifiers.
   * 
   * @returns {object} `this`
   */
  add(...sources)
  {
    for (let source of sources)
    {
      if (source === undefined || source === null)
      { // Skip undefined or null values.
        continue;
      }

      if (typeof source === S)
      { // Try to find a nested property to include.
        if (this.$curSrc === null)
        { // Has not been initialized, let's do that now.
          this._compile();
          this.$curSrc = this.$data;
        }

        if (isObj(this.$curSrc[source]))
        { // Found a property, use it.
          source = this.$curSrc[source];
        }
        else
        { // No such property.
          if (this.$strictProps)
          {
            this._err('Property not found', {source});
          }
          continue;
        }
      }
      
      if (isObj(source))
      { // It's a source to add.
        insert(this.$sources, source, this.$curPos);
      }
      else
      { // That's not valid.
        this._err('invalid source value', {source, sources});
      }
    }

    return this._compile();
  }

  /**
   * Remove existing sources of options.
   * 
   * @param  {...object} sources - Sources to remove.
   * 
   * @returns {object} `this`
   */
  remove(...sources)
  {
    for (const source of sources)
    {
      const index = this.$sources.indexOf(source);
      if (index !== -1)
      {
        this.$sources.splice(index, 1);
      }
    }

    return this._compile();
  }

  /**
   * Remove all current sources. Resets compiled options data.
   * 
   * @returns {object} `this`
   */
  clear()
  {
    this.$sources = [];
    return this._compile();
  }

  /**
   * Get an option value from our compiled data sources.
   * 
   * This uses either `get()` or `getPath()` depending on
   * the specified arguments.
   * 
   * @param {(string|Array)} opt - The name or path of the option to get.
   * 
   * @param {object} [opts] Options
   * 
   * I will only list the options that are specific to this method,
   * as the rest are already documented in `getPath()` and related functions.
   * 
   * Note that some options like `opts.ro` and `opts.default` which are
   * supported by `getPath()` but not `get()` are usable here regardless
   * of which of those functions will end up being called. The method
   * will do the right thing to make those options work in every context.
   * 
   * @param {boolean} [opts.path] Use `getPath()` instead of `get()` ?
   * 
   * If not specified, this will be auto-determined based on the `opt`;
   * if `opt` is an `Array` or contains the `'.'` character the default
   * will be `true`, otherwise it will be `false`.
   * 
   * @returns {*} The output of the `get()` function.
   * @see module:@lumjs/core/opt.getPath
   */
  get(opt, opts={})
  {
    opts = this._opts(opts);

    const isPath = this.constructor.isPath;
    const usePath = opts.path ?? isPath(opt);

    if (usePath)
    {
      return getPath(this.$data, opt, opts);
    }
    else
    {
      return get(this.$data, opt, opts.default, opts);
    }
  }

  /**
   * A wrapper around the `get()` method that can check for
   * multiple possible properties or namespaces, and will
   * return the first one that has a defined value.
   * 
   * @param {object} opts - Options
   * 
   * The same options as the `get()` instance method, which includes all
   * of the options of the `getPath()`, `get()`, and `getObjectPath()`
   * utility functions. So there's a lot of options supported here.
   * 
   * Unlike every other method and function that uses options,
   * this is a mandatory argument. You cannot skip it. If you want
   * to use all default options, just pass `{}` and presto, defaults.
   * 
   * @param  {...(string|Array)} paths - All the properties/paths to try.
   * 
   * At least one path must be specified (although if you were only
   * going to specify one, you may as well use the `get()` method
   * directly rather than this...)
   * 
   * @returns {*} Could be anything!
   */
  find(opts, ...paths)
  { 
    opts = this._opts(opts);

    const defvalue = opts.default;
    delete opts.default;
    delete opts.ro;

    for (const path of paths)
    {
      const value = this.get(path, opts);
      if (value !== undefined)
      { // Found a value.
        return value;
      }
    }

    // No matches found, use the default.
    return val(undefined, defvalue, opts);
  }

} // Opts

exports.Opts = Opts;
