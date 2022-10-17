// Import required bits here.
const {B, N, isObj} = require('../types');
const copyProps = require('./copyprops');

// A shortcut for the recursive option.
const recursive = copyProps.RECURSE_ALL;

/**
 * Merge two objects recursively.
 *
 * This used to be a standalone function, but was poorly designed. 
 * It's now a wrapper around the
 * [copyProps()]{@link module:@lumjs/core/obj.copyProps} method.
 *
 * @param {object} source - The source object we're copying from.
 * @param {object} target - The target object we're copying into.
 *
 * @param {(object|boolean)} [opts] Options for `copyProps()`
 * 
 * If `opts.recursive` is not a `number`, it'll be set to
 * `copyProps.RECURSE_ALL` to enable recursion with no
 * depth limits.
 * 
 * Also, if `opts.overwrite` is not explicitly set, it will
 * be set as `true`, a different default value than `copyProps()`.
 * 
 * For backwards compatibility, if this specified as a `boolean`
 * value instead of an object, it'll be assumed to be value 
 * for the `opts.overwrite` option.
 *
 * @returns {object} The `target` object.
 * @alias module:@lumjs/core/obj.mergeNested
 */
function mergeNested(source, target, opts={})
{
  if (typeof opts === B) 
  { // Boolean overwrite option was specified.
    opts = {overwrite: opts, recursive};
  }
  else if (!isObj(opts))
  { // Wasn't an object, use default values.
    opts = {overwrite: true, recursive};
  }
  else
  { // If recursive or overwrite aren't set, set them.
    if (opts.recursive === undefined)
      opts.recursive = recursive;
    if (opts.overwrite === undefined)
      opts.overwrite = true;
  }
  
  return copyProps(source, target, opts);
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
  * @alias module:@lumjs/core/obj.syncNested
  */
 function syncNested(obj1, obj2, opts1={}, opts2=opts1)
 {
   mergeNested(obj1, obj2, opts1)
   mergeNested(obj2, obj1, opts2);
 }

 exports.syncNested = syncNested;
