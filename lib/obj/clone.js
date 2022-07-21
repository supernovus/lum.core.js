// Import *most* required bits here.
const {B,N,F, isObj, isComplex, def} = require('../types');
const Enum = require('../enum');
const copyProps = require('./copyprops');

/**
 * An enum of supported modes for the `clone` method.
 * 
 * - **P** = All properties. If unchecked, enumerable properties only.
 * - **A** = Uses `Array.slice()` shortcut for shallow Array cloning.
 * - **R** = Recursive (deep) cloning of nested objects.
 * 
 * | Mode | P | A | R | Notes |
 * | ---- | - | - | - | ----- |
 * | `CLONE.DEF` | × | ✓ | × | Default mode for cloning functions. |
 * | `CLONE.DEEP` | × | × | ✓ | |
 * | `CLONE.FULL` | ✓ | ✓ | × | |
 * | `CLONE.ALL` | ✓ | × | × | |
 * | `CLONE.ENTIRE` | ✓ | × | ✓ | |
 * | `CLONE.JSON` | × | × | ✓ | Uses JSON, so no `function` or `symbol` support. |
 * 
 * @alias module:@lumjs/core/obj.CLONE
 */
 const CLONE = Enum(['DEF','FULL','ALL','DEEP','ENTIRE','JSON']);

 exports.CLONE = CLONE;

 // A list of modes that should use the array.slice shallow shortcut.
 const SLICE_ARRAYS = [CLONE.DEF, CLONE.FULL];

 // A list of modes that should get *all* properties.
 const ALL_PROPS = [CLONE.FULL, CLONE.ALL, CLONE.DEEP];

 // A list of modes that should do recursive cloning of objects.
 const RECURSIVE = [CLONE.DEEP, CLONE.ENTIRE];
 
 /**
  * Clone an object or function.
  *
  * @param {object|function} obj - The object we want to clone.
  * @param {object} [opts={}] - Options for the cloning process.
  * 
  * @param {number} [opts.mode=CLONE.DEF] - One of the `CLONE.*` enum values.
  * 
  *   Note: The `CLONE` enum is also aliased as `clone.MODE` as an alternative.
  *
  * @param {boolean} [opts.addClone=false] - Call `addClone()` on the cloned object.
  *
  *   The options sent to this function will be used as the defaults in
  *   the `clone()` method added to the object.
  *
  * @param {boolean} [opts.addLock=false] - Call `addLock()` on the cloned object.
  *
  *   No further options for this, just add a `lock()` method to the clone.
  *
  * @param {?object} [opts.copy] Call `copyProps()` on the cloned object.
  *
  *   Will pass the original `obj` as the source to copy from.
  *   Will pass `opts.copy` as the options.
  *
  * @return {object} - The clone of the object.
  * @alias module:@lumjs/core/obj.clone
  */
function clone(obj, opts={}) 
{
  //console.debug("clone()", obj, opts);

  if (!isComplex(obj))
  { // Doesn't need cloning.
    //console.debug("no cloning required");
    return obj;
  }

  if (!isObj(opts))
  { // Opts has to be a valid object.
    opts = {};
  }

  const mode    = typeof opts.mode      === N ? opts.mode      : CLONE.DEF;
  const reclone = typeof opts.addClone  === B ? opts.addClone  : false;
  const relock  = typeof opts.addLock   === B ? opts.addLock   : false;

  let copy;

  //console.debug("::clone", {mode, reclone, relock});

  if (mode === CLONE.JSON)
  { // Deep clone enumerable properties using JSON trickery.
    //console.debug("::clone using JSON cloning");
    copy = JSON.parse(JSON.stringify(obj));
  }
  else if (Array.isArray(obj) && SLICE_ARRAYS.includes(mode))
  { // Make a shallow copy using slice.
    //console.debug("::clone using Array.slice()");
    copy = obj.slice();
  }
  else
  { // Build a clone using a simple loop.
    //console.debug("::clone using simple loop");
    copy = {};

    let props;
    if (ALL_PROPS.includes(mode))
    { // All object properties.
      //console.debug("::clone getting all properties");
      props = Object.getOwnPropertyNames(obj);
    }
    else
    { // Enumerable properties.
      //console.debug("::clone getting enumerable properties");
      props = Object.keys(obj);
    }

    //console.debug("::clone[props]", props);
    
    for (const prop of props)
    {
      let val = obj[prop];
      if (isObj(val) && RECURSIVE.includes(mode))
      { // Deep cloning.
        val = clone(val, {mode});
      }
      copy[prop] = val;
    }
  }

  if (reclone)
  { // Add the clone() method to the clone, with the passed opts as defaults.
    addClone(copy, opts);
  }

  if (opts.copy)
  { // Pass the clone through the copyProps() function as well.
    copyProps(obj, copy, opts.copy);
  }

  if (relock)
  { // Add the lock() method to the clone.
    addLock(copy, opts);
  }

  return copy;
}

// Alias the CLONE enum as clone.MODE
def(clone, 'MODE', CLONE);

// Export the clone here.
exports.clone = clone;
 
 /**
  * Add a clone() method to an object.
  *
  * @param {object|function} obj - The object to add clone() to.
  * @param {object} [defOpts=null] Default options for the clone() method.
  *
  * If `null` or anything other than an object, the defaults will be:
  *
  * ```{mode: CLONE.DEF, addClone: true, addLock: false}```
  *
  * @alias module:@lumjs/core/obj.addClone
  */
function addClone(obj, defOpts=null)
{
  if (!isObj(defOpts))
  { // Assign a default set of defaults.
    defOpts = {mode: CLONE.DEF, addClone: true, addLock: false};
  }

  const defDesc = defOpts.cloneDesc ?? {};

  defDesc.value = function (opts)
  {
    if (!isObj(opts)) 
      opts = defOpts;
    return clone(obj, opts);
  }

  return def(obj, 'clone', defDesc);
}

exports.addClone = addClone; 
 
 /**
  * Clone an object if it's not extensible (locked, sealed, frozen, etc.)
  *
  * If the object is extensible, it's returned as is.
  *
  * If not, if the object has a `clone()` method it will be used.
  * Otherwise use our `clone()` function.
  *
  * @param {object} obj - The object to clone if needed.
  * @param {object} [opts] - Options to pass to `clone()` method.
  *
  * @return {object} - Either the original object, or an extensible clone.
  *
  * @alias module:@lumjs/core/obj.cloneIfLocked
  */
function cloneIfLocked(obj, opts)
{
  if (!Object.isExtensible(obj))
  {
    if (typeof obj.clone === F)
    { // Use the object's clone() method.
      return obj.clone(opts);
    }
    else
    { // Use our own clone method.
      return clone(obj, opts);
    }
  }

  // Return the object itself, it's fine.
  return obj;
}

exports.cloneIfLocked = cloneIfLocked;

// Import `addLock()` here *after* assigning the clone methods.
const {addLock} = require('./lock');
