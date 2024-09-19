"use strict";

const {S,isObj} = require('./types')
const ctx = require('./context')
const ns = require('./obj/ns');
const cp = require('./obj/cp');
const stateSym  = Symbol('@lumjs/core/state')
const stateData = {[stateSym]: false}
const stateKey  = 'LUM_JS_STATE'
const stateOpts = {}

function getOpts(localOpts)
{
  return Object.assign({}, stateOpts, localOpts);
}

/**
 * A simple persistent state helper object.
 * 
 * Will use `localStorage` in a browser environment,
 * and `process.env` if running in Node.js.
 * 
 * In both cases the key `LUM_JS_STATE` is used,
 * and the value must be valid JSON data.
 * 
 * @exports module:@lumjs/core/state
 */
exports = module.exports =
{
  /**
   * Load (retrieve) state data
   * @param {object} [opts] Options
   * @param {boolean} [opts.refresh=false] Refresh data from storage?
   * 
   * If `true` this will force the data to be reloaded from storage.
   * If `false` previously loaded data will be returned as is.
   * 
   * @param {function} [opts.jsonRevive] JSON.parse() reviver
   * 
   * @returns {object}
   */
  load(opts)
  {
    opts = getOpts(opts);

    if (opts.refresh || !stateData[stateSym])
    {
      let json;
      if (ctx.isNode)
      {
        json = process.env[stateKey];
      }
      else if (ctx.isBrowser)
      {
        json = localStorage.getItem(stateKey);
      }
  
      if (typeof json === S)
      {
        const revive = opts.jsonRevive;
        const storedData = JSON.parse(json, revive);
        if (isObj(storedData))
        {
          Object.assign(stateData, storedData);
        }
      }

      stateData[stateSym] = true;
    }

    return stateData;
  },

  /**
   * Save current state data into persistent storage.
   * 
   * In a web browser environment, this will save the data
   * into the `localStorage` global object directly.
   * 
   * In Node.js while this updates the `process.env` object,
   * there's no way to export to the environment in a truly 
   * persistent way. So this also will output a shell statement
   * via `console.log()` that can be exported into the environment 
   * (or added to a `.env` file, etc.)
   * 
   * @param {object} [opts] Options
   * @param {function} [opts.jsonReplace] JSON.stringify() replacer
   * @returns {string} The JSON data
   */
  save(opts)
  {
    if (!stateData[stateSym]) return false;

    opts = getOpts(opts);
  
    const replace = opts.jsonReplace;
    let json = JSON.stringify(stateData, replace);
  
    if (ctx.isBrowser)
    {
      localStorage.setItem(stateKey, json);
    }
    else if (ctx.isNode)
    {
      process.env[stateKey] = json;
      console.log(`${stateKey}='${json.replaceAll("'", "'\"'\"'")}'`);
    }

    return json;
  },

  /**
   * Get a property value from the state data via a namespace path
   * @param {(string|string[])} path - Namespace path to get
   * @param {object} [opts] Options for `load()` and `getObjectPath()`
   * @returns {*} The property value (or `undefined` if not found)
   * @see module:@lumjs/core/obj.getObjectPath
   */
  get(path, opts)
  {
    const data = exports.load(opts);
    return ns.getObjectPath(data, path, opts);
  },

  /**
   * Set a (nested) property value in the state data
   * @param {(string|string[])} path - Namespace path to set
   * @param {*} value - Value to set the property to
   * @param {object} [opts] Options for `load()` and `setObjectPath()`
   * 
   * The call to `setObjectPath()` has a few different defaults here:
   * - `opts.assign` defaults to `true`
   * - `opts.overwrite` defaults to `true`
   * - `opts.value` is **forced** to the `value` argument
   * 
   * @returns {*}
   * @see module:@lumjs/core/obj.setObjectPath
   */
  set(path, value, opts)
  {
    const loadOpts = cp({refresh: false}, opts);
    const setOpts = cp({assign: true, overwrite: true}, opts, {value});
    const data = exports.load(loadOpts);
    return ns.setObjectPath(data, path, setOpts);
  },

  /**
   * Get a property value from the state data via a namespace path
   * @param {(string|string[])} path - Namespace path to delete
   * @param {object} [opts] Options for `load()` and `delObjectPath()`
   * @returns {*} The property value (or `undefined` if not found)
   * @see module:@lumjs/core/obj.delObjectPath
   */
  del(path, opts)
  {
    const data = exports.load(cp({refresh: false}, opts));
    return ns.delObjectPath(data, path, opts);
  },

  /**
   * Default options for `load()` and `save()` methods.
   * 
   * Any of the options supported by those methods can be set here.
   * 
   * The `refresh` option will be ignored by the `set()` and `del()` 
   * methods if it's specified here.
   * 
   * @type {object}
   */
  opts: stateOpts,
  
  [stateSym]: stateData,
  $$: stateSym,
}
