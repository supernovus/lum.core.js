/**
 * Functions for working with options and default values.
 * @module @lumjs/core/opt
 */

const {U,F,S,needObj,needType} = require('./types');

/**
 * See if a value is *set*, and if not, return a default value.
 *
 * @param {*} opt - The value we are testing.
 * @param {*} defvalue - The default value if opt was null or undefined.
 *
 * @param {boolean} [allowNull=false] If true, allow null to count as *set*.
 * @param {boolean} [isLazy=false]    If true, and `defvalue` is a function,
 *                                    use the value from the function as 
 *                                    the default.
 * @param {object} [lazyThis=null]    If `isLazy` is true, this object will
 *                                    be used as `this` for the function.
 *
 * @return {*} Either the specified `opt` value or the default value.
 * @alias module:@lumjs/core/opt.val
 */
function val(opt, defvalue, allowNull=false, isLazy=false, lazyThis=null)
{
  if (typeof opt === U || (!allowNull && opt === null))
  { // The defined value was not "set" as per our rules.
    if (isLazy && typeof defvalue === F)
    { // Get the default value from a passed in function.
      return defvalue.call(lazyThis);
    }
    return defvalue;
  }

  return opt;
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
 * @param {bool}   [allowNull=true] Same as `val()`, but the default is `true`.
 * @param {bool}   [isLazy=false]   Same as `val()`.
 * @param {object} [lazyThis=opts]  Same as `val()`.
 *
 * @return {*} Either the property value, or the default value.
 * module:@lumjs/core/opt.get
 */
function get(obj, optname, defvalue, allowNull=true, isLazy=false, lazyThis=obj)
{
  needObj(obj);
  needType(S, optname);
  return val(obj[optname], defvalue, allowNull, isLazy, lazyThis);
}

exports.get = get;
