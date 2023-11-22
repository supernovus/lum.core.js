/**
 * Map object helper functions.
 * @module @lumjs/core/maps
 */
const {F,isObj} = require('./types/js');

/**
 * Build a `Map` instance out of various types of objects.
 * 
 * @param {object} input - An object to be converted into a `Map`.
 * 
 * Supported object types:
 * 
 * - `Array`, `Map`, or any other object with an `entries()` method.
 * - Implements `Iterable` interface (`[Symbol.iterator]`).
 * - Implements `Iterator` interface (`next()`).
 * - Anything other object we'll use all enumerable properties.
 * 
 * @returns {Map}
 * @alias module:@lumjs/core/maps.mapOf
 */
function mapOf(input)
{
  if (!isObj(input))
  {
    throw new TypeError('Non-object passed to mapOf');
  }

  if (typeof input.entries === F)
  { // Short-cut for Arrays, other Maps, etc.
    return new Map(input.entries());
  }

  const map = new Map();

  if (typeof input[Symbol.iterator] === F)
  { // Using the Iterable interface.
    let i = 0;
    for (const value of input)
    {
      map.set(i++, value);
    }
  }
  else if (typeof thing.next === F)
  { // Using the Iterator interface.
    let i = 0, next;

    while ((next = input.next()) && !next.done)
    {
      map.set(i++, next.value);
    }
  }
  else
  { // A plain old object. Use enumerable properties.
    for (const key in input)
    {
      map.set(key, input[key]);
    }
  }

  return map;
}

module.exports =
{
  mapOf,
}
