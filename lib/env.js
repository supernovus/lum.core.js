'use strict';

const cp = Object.assign;
const ctx = require('./context');
const { df, lazy } = require('./obj');
const { isObj } = require('./types');
const NS = '@lumjs/core/env';
const DataCache = Symbol(NS+'~DataCache');
const Metadata = Symbol(NS+'~Metadata');

const PREV_FE = 'prevItem';
const PREV_WE = 'prevCall';

// TODO: write tests.

// <Private> Callback type check.
function needCB(cb)
{
  if (typeof cb !== 'function')
  {
    throw new TypeError("callback must be a function");
  }
}

const isJsonString = (v) => (typeof v === 'string'
  && ((v.startsWith('{') && v.endsWith('}'))
  || (v.startsWith('[') && v.endsWith(']'))
));

/**
 * Static object containing methods that will be added
 * to every forEach() Item object.
 * @protected
 * @alias module:@lumjs/core/env.ItemMethods
 */
const ItemMethods =
{
  /**
   * Method used to run callback functions.
   * @protected
   * @param {module:@lumjs/core/env~ItemCallback} cb - Callback.
   * @param {string} log - Log name for return value info.
   * - The forEach() method uses `prevItem` for its (top-level) callbacks.
   * - The withEach() method uses `prevCall` for its (2nd-level) callbacks.
   * @returns {mixed} The actual return value from the callback.
   */
  callBack(cb, log)
  {
    let status = this.info.status = {cb, item: this};
    status.retval = cb.call(this.env, this);

    if (log) 
    {
      this.info[log] = status;
    }

    return status.retval;
  },
}

/**
 * Pre-defined value handlers and helpers.
 * @type {object}
 * @alias module:@lumjs/core/env.Handlers
 */
const Handlers = 
{
  /**
   * A default pattern used to match strings representing
   * a boolean `false` value. This version matches: 
   * `false`, `n`, `no`, and `off` (all case-insensitive).
   * @type {RegExp}
   */
  falsey: /^(?:false|no?|off)$/i,

  /**
   * A minimalistic value handler for the get() method.
   * 
   * This is a simple implementation that does the following:
   * - If the value is the string `'null'` returns the literal `null`.
   *   The stored string may be overridden using `opts.nulls`.
   * - If the value can be type-cast to a `number`, returns the number.
   * - If a value matches `opts.falsey`, returns boolean `false`.
   * - Anything else is returned as-is.
   * 
   * Notes: 
   * - The string `'0'` will be returned as the number `0`, which is
   *   considered `false` in a boolean context; therefore it is a valid
   *   value to use in your environment variables to represent false.
   *   The other falsey strings are supported as common alternatives.
   * - There are no specific tests for a boolean true value, as JS treats
   *   all non-empty strings as true.
   * 
   * If you want to call this from your own custom getHandler, you should
   * do so _after_ your own tests using the `call` method:
   * 
   * ```js
   * // after your tests fall back on defaults
   * return env.Handlers.getDefault.call(this, value, info);
   * ```
   * 
   * @type {module:@lumjs/core/env~ValueHandler}
   * @alias module:@lumjs/core/env.Handlers.getDefault
   */
  getDefault(v,i)
  {
    let nulls = i.opts.nulls ?? 'null';
    if (v === nulls)
    {
      return null;
    }

    let nv = +v;
    if (Number.isFinite(nv))
    {
      return nv;
    }

    let falsey = i.opts.falsey ?? Handlers.falsey;
    if (falsey.test(v))
    {
      return false;
    }

    return v;
  },

  /**
   * A minimalistic value handler for the set() method.
   * 
   * The values it can handle are:
   * 
   * | JS Value | Uses     | Overriden using |
   * | ---------| -------- | --------------- |
   * | `false`  | `'0'`    | `opts.falses`   |
   * | `true`   | `'1'`    | `opts.trues`    |
   * | `null`   | `'null'` | `opts.nulls`    |
   * 
   * Anything else is returned as-is.
   * 
   * @type {module:@lumjs/core/env~ValueHandler}
   * @alias module:@lumjs/core/env.Handlers.setDefault
   */
  setDefault(v,i)
  {
    if (v === null)  return i.opts.nulls  ?? 'null';
    if (v === true)  return i.opts.trues  ?? '1';
    if (v === false) return i.opts.falses ?? '0';
    return v;
  },
}

/**
 * Default options for the env.* methods.
 * 
 * - cache: `1`
 * - data: `1`
 * - dataSave: `'save'`
 * - empty: `false`
 * - falsey: `Handlers.falsey`
 * - getHandler: `Handlers.getDefault`
 * - setHandler: `Handlers.setDefault`
 * - trim: `true`
 * - wrapJSON: `true`
 * 
 * @alias module:@lumjs/core/env.DefaultOpts
 */
const DefaultOpts =
{
  [Metadata]: {},
  cache: 1,
  data: 1,
  dataSave: 'save',
  empty: false,
  falsey: Handlers.falsey,
  getHandler: Handlers.getDefault,
  setHandler: Handlers.setDefault,
  trim: true,
  wrapJSON: true,
}

/**
 * Get a compiled options object with the defaults and metadata composed.
 * 
 * You may use this if you're going to be using the same options for
 * multiple calls. Is this premature optimisation? Likely. Do I care? Nope.
 * 
 * @param {object} [opts] Options you want to set explicitly.
 * @returns {object}
 * @alias module:@lumjs/core/env.getOpts
 */
function getOpts(opts)
{
  return isObj(opts) && opts[Metadata] ? opts : cp({}, DefaultOpts, opts);
}

/**
 * A wrapper around various environment storage systems.
 * 
 * The storage system used depends on the runtime environment:
 * - On Node this uses `process.env`
 * - On web browsers this uses `localStorage`
 * 
 * In both cases the underlying storage is assumed to use strings
 * for both keys and values, and this module provides conversion
 * functions for many common data types you might want to store.
 * 
 * @exports module:@lumjs/core/env
 */
exports = module.exports = 
{
  [DataCache]: new Map(),
  Handlers,
  Metadata,
  DefaultOpts,
  ItemMethods,
  $$: {DataCache},
  getOpts,

  /**
   * Get a value from the store.
   * 
   * @param {string} key - Key to get.
   * @param {object} [opts] Options.
   * 
   * The `DefaultOpts` property is used to determine default values
   * for any options that are not specified explicitly.
   * 
   * Further options may be added to be used by value handlers.
   * 
   * @param {number} [opts.cache] What values should be cached?
   * 
   * Each level increases what is saved and includes the previous level(s).
   *  
   * - `0` : Don't cache anything.
   * - `1` : Cache data objects.
   * - `2` : Cache any valid values found in storage.
   * - `3` : Cache defined default values.
   * 
   * @param {number} [opts.data] Check for embedded JSON data?
   * 
   * - `0` : Don't support JSON at all.
   * - `1` : Test string values for JSON, if no JSON, use value as is.
   * - `2` : Test string values for JSON, if no JSON, use default value.
   * - `3` : Test string values for JSON, if no JSON, throw a TypeError.
   * 
   * If enabled, when a string value starts with `{` and ends with `}`, 
   * or starts with `[` and ends with `]`, we will attempt to parse it as JSON
   * and if it parses into an object, use that object as the value.
   * 
   * @param {?string} [opts.dataSave] Add a save() method to data objects?
   * 
   * If this is set to a non-empty string then a method with that name will
   * be added to data objects. Note: if an existing property has the name
   * specified here, an error will be thrown declaring the conflict!
   * 
   * The added method is a wrapper around env.set() that will use the options
   * passed to get() as defaults, so if you have a custom `opts.revive`,
   * you should probably pass the corresponding `opts.replace` as well.
   * 
   * If you set this to a blank string or null then no method will be assigned.
   * 
   * @param {mixed} [opts.default] Default value.
   * 
   * Used if `key` was not found in the underlying data store.
   * It may also be used if the key was found but wasn't a valid value.
   * 
   * If this is a `function`, it will be called with `this` module
   * as the context object, and passed the `key` and `opts` arguments.
   * 
   * If it is not specified the default value will be undefined.
   * 
   * @param {boolean} [opts.empty] Do empty strings count?
   * 
   * If this is false, then empty strings will be considered the same as if
   * the key had not been set at all.
   * 
   * If this is true, then empty strings will be counted as set.
   * 
   * @param {module:@lumjs/core/env~ValueHandler} [opts.getHandler]
   * @param {boolean} [opts.refresh] Skip the cache?
   * 
   * If this is set to true then the cache won't be checked for the key,
   * and the value will always be looked up from the live environment.
   *
   * @param {function} [opts.revive] A JSON reviver.
   * 
   * Only used if `opts.data` is true and the value matched one of the
   * patterns used to check for JSON data strings.
   * 
   * If `opts.wrapJSON` is true then this function will be called as
   * a ValueHandler callback from an anonymous reviver function;
   * otherwise it is directly used as the reviver argument.
   * 
   * @param {boolean} [opts.trim] Trim leading/trailing whitespace?
   * 
   * This option directly affects `opts.empty`, as if a value consists of
   * only whitespace, the trimmed version will be an empty string.
   * 
   * @param {boolean} [opts.wrapJSON] Wrap the reviver for extended context?
   * @returns {mixed} Return value depends on if the key was found,
   * the default value specified, and the various options.
   * 
   * The underlying data stores use string values, so if the key was
   * found and associated with a valid value, this will return a string.
   */
  get(key, opts)
  {
    opts = getOpts(opts);

    if (!opts.refresh && this[DataCache].has(key))
    {
      return this[DataCache].get(key);
    }

    let info = {key, opts, env: this};

    let value = this.getStr(key),
        cache = false;

    if (typeof value === 'string')
    {
      value = this.getParsed(value, info);
    }

    if (value === undefined)
    {
      value = (typeof opts.default === 'function')
        ? opts.default.call(this, key, opts)
        : opts.default;
    }

    if (isObj(value))
    { 
      cache = (opts.cache > 0);
      this.extendObject(value, info);
    }
    else if (value !== undefined)
    {
      cache = (opts.cache > 1);
    }

    if (cache)
    {
      this[DataCache].set(key, value);
    }

    return value;
  },

  /**
   * A semi-private sub-method that parses strings into other JS values.
   * 
   * It currently handles the following options:
   * `trim`, `empty`, `getHandler`, `data`, `revive`, and `wrapJSON`.
   * See {@link module:@lumjs/core/env.get get()} for details. 
   * 
   * Not meant to be called from outside get() or load() methods;
   * assumes all arguments are already validated/compiled/etc.
   * @protected
   * @param {string} value - String value to be parsed.
   * @param {module:@lumjs/core/env~ContextInfo} info - Context info.
   * @returns {mixed} Value after conversion; undefined if no valid value found.
   */
  getParsed(value, info)
  {
    let {opts} = info;

    if (opts.trim)
    {
      value = value.trim();
    }
    if (!opts.empty && value === '')
    { // No empty strings allowed.
      return undefined;
    }

    if (typeof opts.getHandler === 'function')
    {
      value = opts.getHandler.call(info, value, info);
    }

    if (opts.data)
    { // Look for JSON data.
      let foundJSON = false, log = opts.log;

      if (isJsonString(value))
      {
        let reviver = opts.revive ?? opts.jsonRevive;
        if (opts.wrapJSON && typeof reviver === 'function')
        {
          let revive = reviver;
          reviver = function(key, value, ctx)
          {
            info.json = {key, ctx, target: this};
            return revive.call(info, value, info);
          }
        }

        try 
        {
          let jd = JSON.parse(value, reviver);
          if (isObj(jd))
          {
            value = jd;
            foundJSON = true;
          }
        }
        catch (e)
        {
          if (log)
          {
            console.error(e, {value, ...info});
            log = false;
          }
        }
      }

      if (!foundJSON && opts.data > 1)
      { // Didn't find JSON data but it was expected.
        if (log) console.warn({value, ...info});
        value = undefined;
        if (opts.data > 2)
        {
          throw new TypeError("Invalid JSON data");
        }
      }
    }

    return value;
  },

  /**
   * A semi-private sub-method that can add special methods and properties
   * to data objects depending on the options.
   * 
   * It currently handles the following options: `dataSave`.
   * See {@link module:@lumjs/core/env.get get()} for details. 
   * 
   * Not meant to be called from outside get() or load() methods;
   * assumes all arguments are already validated/compiled/etc.
   * @protected
   * @param {object} value - Data value object to be extended.
   * @param {module:@lumjs/core/env~ContextInfo} info - Context info.
   * @returns {void}
   */
  extendObject(value, info)
  {
    let {opts} = info;

    if (typeof opts.dataSave === 'string')
    { // Add a save() method.
      let meth = opts.dataSave;
      if (value[meth] !== undefined)
      {
        console.error({key, opts, data: value});
        throw new RangeError(meth+' property already exists');
      }

      df(value, meth, 
      {
        value(lopts)
        {
          return exports.set(key, this, cp({}, opts, lopts));
        },
      });
    }
  },

  /**
   * Set a value in the data store.
   * 
   * @param {string} key - Key to set.
   * @param {mixed} value - Value to set.
   * @param {object} [opts] Options.
   * 
   * @param {boolean} [opts.cache=1] What values should be cached?
   * 
   * Each level increases what is saved and includes the previous level(s).
   *  
   * - `0` : Don't cache anything.
   * - `1` : Cache objects (default).
   * - `2` : Cache any defined values.
   * - `9` : Cache-only mode (don't save back to underlying storage).
   * 
   * The last level is only for very specific use cases and not generally
   * recommended unless you really know what you're doing!
   * 
   * @param {module:@lumjs/core/env~ValueHandler} [opts.setHandler]
   * @param {(function|Array)} [opts.replace] A JSON replacer.
   * 
   * This is only used if `value` is an `object`.
   * 
   * If `opts.wrapJSON` is true AND this is a `function`, it will be called as
   * a ValueHandler callback from an anonymous replacer function.
   * In any other case it is directly used as the replacer argument.
   * 
   * @param {boolean} [opts.wrapJSON] Wrap the replacer for extended context?
   * @returns {module:@lumjs/core/env~SetInfo}
   */
  set(key, value, opts)
  {
    opts = getOpts(opts);

    let info = {key, value, opts, ok: true, env: this};

    if (value !== undefined
      && (opts.cache > 1 
      || (opts.cache > 0 && isObj(value))))
    {
      this[DataCache].set(key, value);
    }

    if (opts.cache >= 9)
    { // Cache-only mode is in use.
      return info;
    }

    if (typeof opts.setHandler === 'function')
    {
      value = opts.setHandler.call(info, value);
    }

    if (isObj(value))
    {
      let json = null, 
          replacer = opts.replace ?? opts.jsonReplace;
      
      if (opts.wrapJSON && typeof replacer === 'function')
      {
        let replace = replacer;
        replacer = function(key, value)
        {
          info.json = {key, target: this};
          return replace.call(info, value, info);
        }
      }
      
      try 
      {
        json = JSON.stringify(value, replacer);
      }
      catch (e)
      {
        console.error(e);
        info.error = e;
      }

      info.json = json;

      if (typeof json === 'string')
      {
        value = json;
      }
      else
      {
        info.ok = false;
        return info;
      }
    }
    
    this.setStr(key, value.toString());
    return info;
  },

  /**
   * A semi-private sub-method used by load().
   *
   * - First calls getParsed() for `string` values.
   * - Then extendObject() for `object` values.
   * - Finally calls set() with the final value.
   * @protected
   * @param {string} key
   * @param {mixed} value
   * @param {object} opts
   * @returns {module:@lumjs/core/env~SetInfo}
   */
  setSource(key, value, opts)
  {
    let info = {key, opts, env: this};

    if (typeof value === 'string')
    {
      value = this.getParsed(value, info);
    }

    if (isObj(value))
    {
      this.extendObject(value, info);
    }

    return this.set(key, value, opts);
  },

  /**
   * Load extra environment variables.
   * 
   * This is meant for packages like @lumjs/envfile and @lumjs/dotjs
   * to be able to load environment variables from a file.
   * 
   * @param {object} values - Variables to load.
   * 
   * This may be a Map instance, just noting that only string keys are
   * supported by the underlying storage systems. Value types aren't as
   * important and may either be any JS type supported by set(), or any 
   * of the string formats supported by get().
   * 
   * If this is any other type of object, all enumerable properties with
   * string keys will be used as the key/value pairs.
   * 
   * @param {object} [opts] Options.
   * @returns {Map} The return values from each set() call.
   */
  load(values, opts)
  {
    if (!isObj(values))
    {
      throw new TypeError("values must be an object");
    }

    opts = getOpts(opts);

    let stats = new Map();
    let sets = (k,v) => stats.set(k, this.setSource(k, v, opts));

    if (values instanceof Map)
    {
      for (let [key,val] of values)
      {
        sets(key,val);
      }
    }
    else
    {
      for (let key in values)
      {
        sets(key, values[key]);
      }
    }

    return stats;
  },

  /**
   * Remove a key from the cache (if it was cached).
   * @param {string} key - Key to remove from cache.
   * @returns {object} this module.
   */
  uncache(key)
  {
    this[DataCache].delete(key);
    return this;
  },

  /**
   * Remove a key from the underlying storage.
   * @function module:@lumjs/core/env.unset
   * @param {string} key - Key to remove from storage.
   * @returns {object} this module.
   */

  /**
   * Calls both uncache() and unset() at once.
   * @param {string} key - Key to remove.
   * @returns {object} this.module
   */
  remove(key)
  {
    return this.uncache(key).unset(key);
  },

  /**
   * Clear the data cache.
   * 
   * This removes all items from the cache.
   * It has no affect whatsoever on the underlying storage.
   * 
   * @returns {object} this module.
   */
  clear()
  {
    this[DataCache].clear();
    return this;
  },

  /**
   * Call a callback function for every storage item.
   * @function module:@lumjs/core/env.forEach
   * @param {module:@lumjs/core/env~ItemCallback} cb - Callback function.
   * @param {object} [opts] Options for get() method.
   * 
   * The _item object_ passed to the callback has a lazy-loaded property
   * called `value` that calls `get(key, opts)` the first time its accessed.
   * 
   * The options are also available as an `opts` property in the item object,
   * so the callbacks themselves may use them to specify their own options.
   * 
   * @returns {object} Final compiled options.
   * 
   * Composes passed `opts` with the get() default options and includes
   * an `env.Metadata` symbol property with information about the process.
   */

  /**
   * A wrapper around forEach() that can chain nested callback functions.
   * 
   * If more than one callback is specified, this generates an implicit 
   * forEach() callback which calls all of the callback arguments in the
   * order they were specified in.
   * 
   * If one of the child callback functions returns boolean `false`, or an
   * Error instance, no further callbacks will be called with that item.
   * 
   * If only ONE callback is specified, it will be passed directly to the
   * forEach() method, skipping any of the chaining logic entirely.
   * 
   * If NO callbacks are specified, an error will be thrown!
   * 
   * @param {?object} opts - Options to be passed to forEach() method.
   * @param {...module:@lumjs/core/env~ItemCallback} callbacks - Callbacks.
   * @returns {object} Output from forEach()
   * @throws {RangeError} If no callbacks were specified.
   */
  withEach(opts, ...callbacks)
  {
    if (callbacks.length === 0)
    {
      throw new RangeError("at least one callback must be specified");
    }

    if (callbacks.length === 1)
    {
      return this.forEach(callbacks[0], opts);
    }

    return this.forEach((item) => 
    {
      let retval;
      for (let cb of callbacks)
      {
        if (typeof cb === 'function')
        {
          retval = item.callBack(cb, PREV_WE);
          if (retval === false || retval instanceof Error)
          { // We're done here.
            return retval;
          }
        }
        else
        {
          console.error("invalid callback", cb, {opts, callbacks});
        }
      }
      return retval;
    }, opts);
  },

  /**
   * A simplified withEach() wrapper that has an API closer to forEach(),
   * but supports an additional filter callback option.
   * 
   * This is primarily used by the getMap() and getProps() methods.
   * 
   * @param {module:@lumjs/core/env~ItemCallback} main - Main callback.
   * @param {object} [opts] Options.
   * 
   * In addition to the `filter` option specific to this method,
   * see {@link module:@lumjs/core/env.forEach forEach()} and
   * {@link module:@lumjs/core/env.get get()} for more supported options.
   * 
   * @param {module:@lumjs/core/env~ItemCallback} [opts.filter] Filter.
   * 
   * If this callback is specified, it will be called _before_ `main`,
   * and its return value will determine which items will actually be
   * passed to the main callback.
   */
  getWith(main, opts)
  {
    opts = getOpts(opts);
    let callbacks = [main];
    if (typeof opts.filter === 'function')
    {
      callbacks.unshift(opts.filter);
    }
    return this.withEach(opts, ...callbacks);
  },

  /**
   * Get a Map containing all keys/values in the environment storage.
   * 
   * See {@link module:@lumjs/core/env.getProps getProps()} for a version
   * that returns a plain object instead of a Map.
   * 
   * @param {object} [opts] Options;
   * See {@link module:@lumjs/core/env.getWith getWith()} for details.
   * @returns {Map}
   */
  getMap(opts)
  {
    let map = new Map();
    this.getWith(item => map.set(item.key, item.value), opts);
    return map;
  },

  /**
   * Get an object containing all keys/values in the environment storage.
   * 
   * See {@link module:@lumjs/core/env.getMap getMap()} for a version
   * that returns a Map instead of a plain object.
   * 
   * @param {object} [opts] Options;
   * See {@link module:@lumjs/core/env.getWith getWith()} for details.
   * @returns {object}
   */
  getProps(opts)
  {
    let props = {};
    this.getWith(item => props[item.key] = item.value, opts);
    return props;
  },

  /**
   * Private method that builds the forEach() Item objects.
   * @private
   * @param {string} key  - Key for current item.
   * @param {object} opts - Compiled options.
   * @returns {module:@lumjs/core/env~CallbackItem}
   */
  forItem(key, opts)
  {
    return lazy(
    {
      key, 
      opts, 
      info: opts[Metadata], 
      env: this, 
      ...ItemMethods,
    }, 'value', () => this.get(key, opts));
  },

  /**
   * Private method that returns a forEach() Runner object.
   * No formal docs for Runners as they aren't meant for public use.
   * @private
   * @param {module:@lumjs/core/env~ItemCallback} cb - Callback.
   * @param {object} [opts] Options.
   * @returns {object} Runner object. Has two methods:
   * - `run(key)` → Called once for every key in the storage.
   * - `done()`   → Called when all keys have been handled.
   */
  forRunner(cb, opts)
  {
    needCB(cb);
    opts = getOpts(opts);
    let env = this;
    return {
      run(key)
      {
        env.forItem(key, opts).callBack(cb, PREV_FE);
      },
      done()
      {
        delete opts[Metadata].status;
        return opts;
      }
    };
  }
}

/**
 * Alias of remove() method.
 * @param {string} key - Key to delete.
 * @returns {object} this
 */
exports.delete = exports.remove;

// Now the platform-specific methods are added!

if (ctx.isNode)
{
  exports.getStr = function(key)
  {
    return process.env[key];
  }

  exports.setStr = function(key, value)
  {
    process.env[key] = value;
    return this;
  }

  // I don't know if that's gonna do much, but anyway...
  exports.unset = function(key)
  {
    delete process.env[key];
  }

  exports.forEach = function(cb, opts)
  {
    cb = this.forRunner(cb, opts);
    for (let key in process.env)
    {
      cb.run(key);
    }
    return cb.done();
  }
}
else if (ctx.isBrowser)
{
  exports.getStr = function(key)
  { // getItem returns null for no value, but we want undefined.
    return localStorage.getItem(key) ?? undefined;
  }

  exports.setStr = function(key, value)
  {
    localStorage.setItem(key, value);
    return this;
  }

  exports.unset = function(key)
  {
    localStorage.removeItem(key);
    return this;
  }

  exports.forEach = function(cb, opts)
  {
    cb = this.forRunner(cb, opts);
    for (let i=0; i < localStorage.length; i++)
    {
      let key = localStorage.key(i);
      cb.run(key);
    }
    return cb.done();
  }
}
