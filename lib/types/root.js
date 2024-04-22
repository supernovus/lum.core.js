const {U} = require('./js');
const {isNil,isArray} = require('./basics');
const removeFromArray = require('../arrays/list').removeItems;

// «private»
function no_root()
{
  throw new Error("Invalid JS environment, no root object found");
}

/**
 * The global root object. Usually `globalThis` these days.
 * @alias module:@lumjs/core/types.root
 */
const root = typeof globalThis !== U ? globalThis
  : typeof global !== U ? global 
  : typeof self !== U ? self 
  : typeof window !== U ? window 
  : no_root(); // Unlike the old way, we'll die if the environment is undetermined.

exports.root = root;

// A list of objects to be considered unbound globally.
const unboundObjects = [];

/**
 * Pass `this` here to see if it is bound to an object.
 * 
 * Always considers `null` and `undefined` as unbound.
 * 
 * @param {*} whatIsThis - The `this` from any context.
 * @param {boolean} [rootIsUnbound=true] The global root is unbound. 
 * @param {(boolean|Array)} [areUnbound=false] A list of unbound objects.
 *   If the is `true` we use an global list that can register special
 *   internal objects. Otherwise an `Array` of unbound objects may be used.
 * @returns {boolean}
 * @alias module:@lumjs/core/types.unbound
 */
function unbound(whatIsThis, rootIsUnbound=true, areUnbound=false)
{
  if (areUnbound === true)
  { // If areUnbound is true, we use the unboundObjects 
    areUnbound = unboundObjects;
  }

  if (isNil(whatIsThis)) return true;
  if (rootIsUnbound && whatIsThis === root) return true;
  if (isArray(areUnbound) && areUnbound.includes(whatIsThis)) return true;

  // Nothing considered unbound.
  return false;
}

exports.unbound = unbound;

// Now that 'unbound' is exported, we can do some wibbly wobbly magic.
const def = require('./def');

/**
 * Add an item to the unbound global objects list.
 * 
 * @function
 * @param {(object|function)} obj - The object to be considered unbound.
 * @returns {boolean} Will be `false` if `obj` is already unbound.
 * @throws {TypeError} If `obj` was neither an `object` nor a `function`.
 * @alias module:@lumjs/core/types.unbound.add
 */
def(unbound, 'add', function (obj)
{
  needObj(obj, true);
  if (unbound(obj, true, true))
  { // Item is already unbound.
    return false;
  }
  // Add to list and we're done.
  unboundObjects.push(obj);
  return true;
});

/**
 * Remove an item from the unbound global objects list.
 * 
 * @function
 * @param {(object|function)} obj - The object to be removed.
 * @returns {boolean} Will be `false` if the item was not in the list.
 * @throws {TypeError} If `obj` was neither an `object` nor a `function`.
 * @alias module:@lumjs/core/types.unbound.remove
 */
def(unbound, 'remove', function(obj)
{
  needObj(obj, true);
  return (removeFromArray(unboundObjects, obj) > 0);
});
