/**
 * Array helper functions.
 * @module @lumjs/core/arrays
 */

/** 
 * See if an array contains *any* of the specified items.
 * @param {Array} array 
 * @param  {...any} items 
 * @returns {boolean}
 * @alias module:@lumjs/core/arrays.containsAny
 */
 function containsAny(array, ...items)
 {
   for (const item of items)
   {
     if (array.includes(item))
     { // Item found.
       return true;
     }
   }
 
   // No items found.
   return false;
 }
 
 exports.containsAny = containsAny;

 /**
  * See if an array contains *all* of the specified items.
  * @param {Array} array
  * @param  {...any} items 
  * @returns {boolean}
  * @alias module:@lumjs/core/arrays.containsAll
  */
 function containsAll(array, ...items)
 {
   for (const item of items)
   {
     if (!array.includes(item))
     { // An item was missing.
       return false;
     }
   }
   
   // All items found.
   return true;
 }

 exports.containsAll = containsAll;
 
/**
 * Remove items from an array.
 * 
 * Passed any number of items, it will see if any of those items are
 * found in the array, and if they are, will remove them from the array.
 * 
 * @param {Array} array 
 * @param  {...any} items 
 * @returns {number} Number of items actually removed.
 * @alias module:@lumjs/core/arrays.removeItems
 */
function removeItems(array, ...items)
{
  let removed = 0;
  for (const item of items)
  {
    const index = array.indexOf(item);
    if (index !== -1)
    {
      array.splice(index, 1);
      removed++;
    }
  }
  return removed;
}

exports.removeItems = removeItems;

/**
 * Return a Powerset of values in the array.
 * @param {Array} array  The array to make the powerset from.
 * @returns {Array}  The powerset.
 * @alias module:@lumjs/core/arrays.powerset
 */
function powerset(array) 
{
  var ps = [[]];
  for (var i=0; i < array.length; i++) 
  {
    // we modify the ps array in the next loop,
    // so can't use the ps.length property directly in the loop condition.
    var current_length = ps.length;
    for (var j = 0; j < current_length; j++) 
    {
      ps.push(ps[j].concat(array[i]));
    }
  }
  return ps;
}

exports.powerset = powerset;

/**
 * Get a random element from an array.
 * @param {Array} array  The array to get an item from.
 * @returns {mixed}  The randomly selected item.
 * @alias module:@lumjs/core/arrays.random
 */
function random(array)
{
  return array[Math.floor(Math.random()*array.length)];
}

exports.random = random;
