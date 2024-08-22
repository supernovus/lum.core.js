"use strict";

const {U,F} = require('../types/js');
const argOpts = require('./args');

// Helper for `val()` and `get()` to support new-style options.
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

module.exports = {_opts, val};
