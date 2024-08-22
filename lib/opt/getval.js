"use strict";

const {S,needObj,needType} = require('../types');
const {_opts,val} = require('./val');

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

module.exports = {val, get};
