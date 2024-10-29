"use strict";

const {F,S,isObj,needObj} = require('../types');

const CLONE = 'clone';
const clone = obj => Object.assign({}, obj);

/**
 * Get an unlocked object
 * 
 * @param {object} obj - The target object;
 * 
 * If the object is extensible it will be returned _as is_.
 * 
 * If the object is frozen, sealed, or otherwise non-extensible,
 * a cloning function will be used to make an unlocked copy.
 * 
 * @param {(object|function|string)} [opts] Options to customize the behaviour
 * 
 * - If this is a `function` it will be used as the `opts.fn` value.
 * - If this is a `string` it will be used as the `opts.method` value.
 *
 * @param {string} [opts.method='clone'] Object method to use
 * 
 * Set to an empty string `""` to skip checking for an object method.
 * 
 * If the method exists on the target object, it will be called to
 * perform the cloning procedure, otherwise `opts.fn` will be used.
 * 
 * @param {Array} [opts.args] Arguments for `opts.method` method
 * 
 * If not specified, the default value is: `[opts]`
 * 
 * @param {function} [opts.fn] A function to perform the clone operation
 *
 * Must take only a single parameter, which is the object to clone.
 * Must return an extensible clone of the object.
 * 
 * If for whatever reason you need the `opts` in the function,
 * then use a unbound function, and `opts` will be available
 * as `this` in the function body. Arrow functions (closures) are 
 * always considered bound and cannot have a `this` value assigned.
 * 
 * The default value is a closure: `obj => Object.assign({}, obj)`;
 * 
 * @return {object}
 *
 * @alias module:@lumjs/core/obj.unlocked
 */
function unlocked(obj, opts={})
{
  needObj(obj, true, "invalid obj value");
  
  if (Object.isExtensible(obj))
  { // We're done here.
    return obj;
  }

  if (typeof opts === F)
  {
    opts = {fn: opts}
  }
  else if (typeof opts === S)
  {
    opts = {method: opts}
  }
  else if (!isObj(opts))
  {
    console.error({obj, opts});
    throw new TypeError("invalid opts value");
  }

  const fn   = (typeof opts.fn     === F) ? opts.fn            : clone;
  const meth = (typeof opts.method === S) ? opts.method.trim() : CLONE;
  const args = (Array.isArray(opts.args)) ? opts.args          : [opts];

  if (meth && typeof obj[meth] === F)
  { // Use a clone method
    return obj[meth](...args);
  }
  else
  { // Use a clone function
    return fn.call(opts, obj);
  }
}

module.exports = unlocked;
