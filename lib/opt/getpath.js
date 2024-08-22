"use strict";

const {getObjectPath} = require('../obj/ns');
const {val} = require('./val');

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

module.exports = getPath;
