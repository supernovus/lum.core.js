/**
 * Return the number of _local_ properties in an object.
 * 
 * @param {(object|function)} v - The value we want the property count of.
 * 
 * This can be any kind of `object`, or it can be a `function` that has
 * a `prototype` property which is a `object`. Anything else is invalid.
 * 
 * @param {number} [level=0] Determine which properties to count.
 * 
 * - `== 0` : Counts only enumerable properties.
 * - `> 0`  : Includes all properties with string names.
 * - `> 1`  : Also includes symbol properties.
 * 
 * @returns {number} The number of matching properties.
 * 
 * If `v` was an invalid value, this will return `-1`.
 * 
 * @alias module:@lumjs/core/types.ownCount
 */
function ownCount(v, level=0)
{
  if (typeof v === F && isObj(v.prototype))
  { // If a class constructor is passed, we use the prototype.
    v = v.prototype;
  }
  
  if (!isObj(v))
  { // Nothing more to do here.
    return -1;
  }

  if (level == 0)
  { // Enumerable properties only.
    return Object.keys(v).length;
  }

  // Include all properties with string names.

  let count = Object.getOwnPropertyNames(v).length;

  if (level > 1)
  { // Also include symbol properties.
    count += Object.getOwnPropertySymbols(v).length;
  }

  return count;
}

module.exports = ownCount;
