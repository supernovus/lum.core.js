"use strict";

const { isObj } = require('../types/basics');
const jc = require('./jc');
const { weaveAll } = require('./weave');
const weld = require('./weld');

const METH = 'clone';
const CLONE = {
  assign: obj => Object.assign({}, obj),
  json(obj) {
    return jc(obj, this);
  },
  weave: obj => weaveAll({}, obj),
}

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
 * A few predefined cloning methods are available via properties:
 * 
 * - `unlocked.via.assign`: Uses `Object.assign()`.
 * - `unlocked.via.json`: Uses {@link module:@lumjs/core/obj.jc};
 *   see the docs for `jc()` for supported options.
 * - `unlocked.via.weave`: Uses {@link module:@lumjs/core/obj.weaveAll}.
 * 
 * If this option is omitted, the default is `unlocked.via.assign`.
 * 
 * @return {object}
 *
 * @alias module:@lumjs/core/obj.unlocked
 */
function unlocked(obj, opts={})
{  
  if (Object.isExtensible(obj))
  { // We're done here.
    return obj;
  }

  if (typeof opts === 'function')
  {
    opts = {fn: opts}
  }
  else if (typeof opts === 'string')
  {
    opts = {method: opts}
  }
  else if (!isObj(opts))
  {
    console.error({obj, opts});
    throw new TypeError("invalid opts value");
  }

  const fn = (typeof opts.fn === 'function') ? opts.fn : CLONE.assign;
  const meth = (typeof opts.method === 'string') ? opts.method.trim() : METH;
  const args = (Array.isArray(opts.args)) ? opts.args : [opts];

  if (meth && typeof obj[meth] === 'function')
  { // Use a clone method
    return obj[meth](...args);
  }
  else
  { // Use a clone function
    return fn.call(opts, obj);
  }
}

Object.defineProperty(unlocked, 'via', {value: weld(CLONE)});

module.exports = unlocked;
