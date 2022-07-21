/**
 * Array helper functions.
 * @module module:@lumjs/core/arrays
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
