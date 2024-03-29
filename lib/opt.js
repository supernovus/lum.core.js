/**
 * Functions for working with options and default values.
 * @module @lumjs/core/opt
 */

const {U,F,S,N,B,isObj,isComplex,needObj,needType} = require('./types');
const {insert} = require('./arrays/add');

/**
 * See if a value is *set*, and if not, return a default value.
 *
 * @param {*} optvalue - The value we are testing.
 * @param {*} defvalue - The default value if opt was null or undefined.
 *
 * @param {boolean} [allowNull=false] If true, allow null to count as *set*.
 * @param {boolean} [isLazy=false]    If true, and `defvalue` is a function,
 *                                    use the value from the function as 
 *                                    the default.
 * @param {object} [lazyThis=null]    If `isLazy` is true, this object will
 *                                    be used as `this` for the function.
 * @param {Array}  [lazyArgs]         If `isLazy` is true, this may be used
 *                                    as a list of arguments to pass.
 *
 * @return {*} Either the specified `opt` value or the default value.
 * @alias module:@lumjs/core/opt.val
 */
function val(optvalue, defvalue, 
  allowNull=false, 
  isLazy=false, 
  lazyThis=null,
  lazyArgs=[])
{
  if (typeof optvalue === U || (!allowNull && optvalue === null))
  { // The defined value was not "set" as per our rules.
    if (isLazy && typeof defvalue === F)
    { // Get the default value from a passed in function.
      return defvalue.apply(lazyThis, lazyArgs);
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
 * This uses the `val()` method, and as such supports the same options.
 * However read the parameters carefully, as the defaults may be different!
 *
 * @param {object} obj     - An object to test for a property in.
 * @param {string} optname - The property name we're checking for.
 * @param {*} defvalue     - The default value.
 *
 * @param {bool}   [allowNull=true] Same as `val()`, but default is `true`.
 * @param {bool}   [isLazy=false]   Same as `val()`.
 * @param {object} [lazyThis=opts]  Same as `val()`, but default is `obj`.
 * @param {Array}  [lazyArgs]       Same as `val()`.
 *
 * @return {*} Either the property value, or the default value.
 * @alias module:@lumjs/core/opt.get
 */
function get(obj, optname, defvalue, 
  allowNull=true, 
  isLazy=false, 
  lazyThis=obj,
  lazyArgs)
{
  needObj(obj);
  needType(S, optname);
  return val(obj[optname], defvalue, allowNull, isLazy, lazyThis, lazyArgs);
}

exports.get = get;

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
    this._compile();
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
    let pos=-1;

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
        insert(this.$sources, source, pos);
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
   * This uses the `get()` function, but instead of using positional
   * arguments, it supports an object of named options instead.
   * 
   * @param {string} opt - The name of the option to get.
   * @param {object} [args] Optional arguments for `get()`.
   * @param {*} [args.default] `defvalue` argument.
   * @param {boolean} [args.null=true] `allowNull` argument.
   * @param {boolean} [args.lazy=false] `isLazy` argument.
   * @param {(object|function)} [args.lazyThis] `lazyThis` argument.
   * If this is defined, `args.lazy` will be set to `true`.
   * @param {Array} [args.lazyArgs] `lazyArgs` argument.
   * If this is defined, `args.lazy` will be set to `true`.
   * 
   * @returns {*} The output of the `get()` function.
   */
  get(opt, args={})
  {
    if (isComplex(args.lazyThis) || Array.isArray(args.lazyArgs))
    {
      args.lazy = true;
    }

    return get(this.$data, opt, 
      args.default, 
      args.null, 
      args.lazy, 
      args.lazyThis, 
      args.lazyArgs);
  }
}

exports.Opts = Opts;
