"use strict";

const {isObj} = require('./types')
const ns = require('./obj/ns');
const cp = require('./obj/cp');
const env = require('./env');
const stateSym  = Symbol('@lumjs/core/state')
const stateData = {[stateSym]: false}
const stateKey  = 'LUM_JS_STATE'
const stateOpts = env.getOpts(); // Some default opts.

function getOpts(localOpts)
{
  return Object.assign({}, stateOpts, localOpts);
}

/**
 * A simple persistent state helper object.
 * 
 * Uses the `env` module as an abstraction layer for where
 * the state data is stored.
 * 
 * The key `LUM_JS_STATE` is used, and the value must be valid JSON data.
 * 
 * @deprecated use the more flexible `env` module instead.
 * @exports module:@lumjs/core/state
 */
exports = module.exports =
{
  env,
  
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
      delete opts.default;
      let storedData = env.get(stateKey, opts);
      if (isObj(storedData))
      {
        Object.assign(stateData, storedData);
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
   * In Node.js it is saved to `process.env` but in order to make
   * those changes persist you'd have to save them to an .env file
   * or something similar.
   * 
   * @param {object} [opts] Options
   * @param {function} [opts.jsonReplace] JSON.stringify() replacer
   * @param {function} [opts.onSave] Callback to pass results to.
   * 
   * This exists so that a hook may be added that can save the
   * environment data back into an .env file or something similar
   * on Node.js runtimes where the environment is not persistent.
   * 
   * It will be passed the result object from env.set() and can
   * do with it whatever is required.
   * 
   * @returns {module:@lumjs/core/env~SetResult}
   */
  save(opts)
  {
    if (!stateData[stateSym]) return false;
    opts = getOpts(opts);
    let res = env.set(stateKey, stateData);
    if (typeof opts.onSave === 'function')
    {
      opts.onSave.call(opts, res);
    }
    return res;
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
