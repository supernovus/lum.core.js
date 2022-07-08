// Import required bits here.
const {B, isObj} = require('../types');

/**
 * Merge two objects recursively.
 *
 * This is currently suseptible to circular reference infinite loops,
 * but given what it's designed for, I'm not too worried about that.
 *
 * @param {object} source - The source object we're copying from.
 * @param {object} target - The target object we're copying into.
 *
 * @param {object} [opts] Options that change the behaviour.
 * @param {boolean} [opts.overwrite=true] Allow overwriting.
 *   Unlike `copy` which does not allow overwriting by default,
 *   this method does. It's not designed for the same kind of objects
 *   as `copy`, but more for JSON structured configuration files.
 *
 *   As this is currently the only option, passing the boolean
 *   as the `opts` argument directly will set this option.
 *
 * @returns {object} The `target` object.
 */
 function mergeNested(source, target, opts={})
 {
   if (typeof opts === B) 
     opts = {overwrite: opts};
 
   const overwrite = opts.overwrite ?? true;
 
   for (const prop in source)
   {
     if (isObj(source[prop]) && isObj(to[prop]))
     { // Nested objects, recurse deeper.
       mergeNested(source[prop], target[prop], opts);
     }
     else if (overwrite || target[prop] === undefined)
     { // Not tested objects, do a simple assignment.
       target[prop] = source[prop];
     }
   }
 
   return target;
 }

 exports.mergeNested = mergeNested;
 
 /**
  * Synchronize two objects.
  *
  * Literally just calls `mergeNested` twice, with the two objects swapped.
  * Probably has all kinds of screwy behaviours because of how it works.
  *
  * @param {object} obj1 - The first object.
  *   Because overwrite mode is on by default, any properties in `obj1` will
  *   take precedence over the same properties in `obj2`.
  *
  * @param {object} obj2 - The second object.
  *   Any properties in `obj2` that were not already in `obj1` will be added
  *   to `obj1` thanks to the second merge operation.
  *
  * @param {object} [opts1] Options for the first merge operation.
  *   See `mergeNested` for details on the supported options. 
  * @param {object} [opts2=opts1] Options for the second merge operation.
  *   If this is not specified, `opts2` will be the same as `opts1`.
  *
  */
 function syncNested(obj1, obj2, opts1={}, opts2=opts1)
 {
   mergeNested(obj1, obj2, opts1)
   mergeNested(obj2, obj1, opts2);
 }

 exports.syncNested = syncNested;
