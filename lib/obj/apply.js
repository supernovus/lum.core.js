const {F,isObj} = require('../types');
const copyProps = require('./copyprops');

/**
 * Apply functions to an object
 *  
 * In addition to the parameters passed, we'll also define:
 * 
 * - `cp` will be a `CopyProps` instance via `copyProps.cache.into(obj)`;
 * - `args` will be an array of `[obj, opts]`;
 * - `opts` will be an object of `{obj, cp, args}`;
 * 
 * @param {(object|function)} obj - The target we're applying to.
 * 
 * @param  {...(function|object)} fns - Values we are applying.
 * 
 * For each value of `fns` as `fn`:
 * 
 * - If a `function` we'll call `fn.apply(obj, args)`; 
 * - If an `object` we'll call `cp.from(fn)`.
 * 
 * @returns {object} `obj`
 * @throws {TypeError} If a `fns` value is not valid.
 * @alias module:@lumjs/core/obj.apply
 */
function apply(obj, ...fns)
{
  const cp = copyProps.cache.into(obj);
  const opts = {obj, cp};
  const args = [obj, opts];
  opts.args = args;

  for (const fn of fns)
  {
    if (typeof fn === F)
    { 
      fn.apply(obj, args);
    }
    else if (isObj(fn))
    {
      cp.from(fn);
    }
    else
    {
      throw new TypeError("invalid parameter value");
    }
  }

  return obj;
}

module.exports = apply;
