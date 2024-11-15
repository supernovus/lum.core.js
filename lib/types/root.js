const {U} = require('./js');
const {isNil,isObj,isArray} = require('./basics');

// «private»
function no_root()
{
  throw new Error("Invalid JS environment, no root object found");
}

/**
 * The global root object. Usually `globalThis` these days.
 * @alias module:@lumjs/core/types.root
 */
const root 
  = typeof globalThis !== U ? globalThis
  : typeof global     !== U ? global 
  : typeof self       !== U ? self 
  : typeof window     !== U ? window 
  : no_root(); // Unlike the old way, we'll die if the environment is undetermined.

exports.root = root;

// A Set of objects to be considered unbound globally.
const unboundObjects = require('./unbound/objects');

// Default options for unbound()
const UBDO =
{
  nil:   true,
  root:  true,
}

/**
 * Pass `this` here to see if it is bound to an object.
 * 
 * @param {*} whatIsThis - The `this` from any context
 * 
 * @param {(boolean|object)} [opts] Options for advanced behaviours.
 * 
 * If this is boolean then it'll be used as `opts.root`;
 * If it is an `Array` or `Set` it will be used as `opts.list`;
 * Use just a plain object literal for specifying named options.
 * 
 * TODO: as of v2.0 this will no longer accept a boolean value
 * as a shortcut to `opts.root`. That must be explicitly set.
 * 
 * @param {boolean} [opts.root=true] The global root is unbound?
 * @param {boolean} [opts.nil=true] `null` and `undefined` are unbound?
 * @param {(Array|Set)} [opts.list] A list of additional values that
 * for the purposes of this test will be considered unbound.
 * 
 * @param {(Array|Set|boolean)} [list] A positional version of `opts.list`;
 * ONLY used when the `opts` argument is boolean.
 * 
 * TODO: remove this argument as of v2.0
 * 
 * @returns {boolean}
 * @alias module:@lumjs/core/types.unbound
 */
function unbound(whatIsThis, opts=true, list)
{
  if (isObj(opts))
  { // Merge in defaults
    if (opts instanceof Set || isArray(opts))
    { // A shortcut to the `list` property
      list = opts;
      opts = Object.assign({}, UBDO);
    }
    else
    { // Regular options were specified.
      opts = Object.assign({}, UBDO, {list}, opts);
      list = opts.list;
    }
  }
  else
  { // Assume old positional arguments are being used
    opts = Object.assign({}, UBDO, {root: opts});
  }

  if (list === true)
  { // Internal special unbound values
    list = unboundObjects;
  }

  if (opts.nil && isNil(whatIsThis)) return true;
  if (opts.root && whatIsThis === root) return true;
  if (list instanceof Set && list.has(whatIsThis)) return true;
  if (isArray(list) && list.includes(whatIsThis)) return true;

  // Nothing considered unbound.
  return false;
}

exports.unbound = unbound;
