/**
 * Map object helper functions.
 * @module @lumjs/core/maps
 */
const {F,S,SY,isObj,def,isComplex} = require('./types/js');

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

/**
 * Get a `Map` stored inside any `object` or `function` target,
 * using a `Symbol` property for more protected/private storage.
 * 
 * It will build the `Map` the first time this is called on a given target;
 * then it will use the existing instance for any subsequent calls.
 * 
 * @alias module:@lumjs/core/maps.getSymbolMap
 * 
 * @param {(object|function)} target - The target for the Map storage.
 * 
 * A Symbol property with a new Map instance will be added to the `target` 
 * the first time this function is called. 
 * 
 * Then every subsequent call with the same `target` and `symbol` will 
 * return the Map instance stored in the Symbol property.
 * 
 * @param {(Symbol|string)}   symbol - Symbol used to store the Map.
 * 
 * If this is a `string`, it will be passed to `Symbol.for()` to get
 * a globally registered Symbol to use for the Map storage property.
 * 
 * If you don't want a globally registerd Symbol, simply use `Symbol(name)`
 * in your own class and pass the Symbol itself instead of a string.
 * 
 * @returns {Map}
 * 
 * @throws {TypeError} If any of the parameters are invalid.
 */
function getSymbolMap(target, symbol)
{
  if (typeof symbol === S)
  { // Use a global symbol.
    symbol = Symbol.for(symbol);
  }
  else if (typeof symbol !== SY)
  {
    console.error({symbol});
    throw new TypeError("Invalid symbol");
  }

  if (!isComplex(target))
  {
    console.error({target});
    throw new TypeError("Invalid target object or function");
  }

  if (target[symbol] === undefined)
  { // Have not created the Map yet.
    def(target, symbol, new Map());
  }

  return target[symbol];
}

exports.getSymbolMap = getSymbolMap;

/**
 * A Key-Value Cache using a _Symbol Map_ for storage.
 * 
 * See {@link module:@lumjs/core/maps.getSymbolMap getSymbolMap()} 
 * for the more information about Symbol Map storage and usage.
 * 
 * @alias module:@lumjs/core/maps.getSymbolCache
 * 
 * @param {(object|function)} target - For `getSymbolMap()`
 * @param {(Symbol|string)}   symbol - For `getSymbolMap()`
 * 
 * @param {mixed} key - The key you want from the cache.
 * 
 * If the `key` exists in the cache, and `reset` is `false`,
 * then the value will be returned from the cache.
 * 
 * @param {function} generator - A value generator function.
 * 
 * If the `key` was not found in the cache, or `reset` is `true`,
 * this function must return the value to be cached and returned.
 * 
 * The generator function is called directly, with no `this` assignment,
 * and no arguments. Just `value = generator()`; nothing else!
 * 
 * @param {boolean} [reset=false] Reset the value using the `generator`?
 * 
 * Set this to `true` to force the value to be reset/regenerated,
 * regardless as to if it was already cached or not.
 * 
 * This is the only optional parameter; default is `false`.
 * 
 * @returns {mixed} The cached value, or the value returned by the 
 * `generator` function, depending on cache state and the `reset` value.
 * 
 * @throws {TypeError} If any of the parameters are invalid.
 */
function getSymbolCache(obj, symbol, key, generator, reset=false)
{
  const cache = getSymbolMap(obj, symbol);
  if (!reset && cache.has(key))
  { // Existing value found.
    return cache.get(key);
  }

  if (typeof generator !== F)
  {
    throw new TypeError("Invalid generator function");
  }

  // Get/generate the value, cache it, and return it.
  const value = generator();
  cache.set(key, value);
  return value;
}

module.exports =
{
  mapOf, getSymbolMap, getSymbolCache,
}
