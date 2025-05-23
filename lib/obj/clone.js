// Import *most* required bits here.
const {N,F, isObj, isComplex, def, isArray} = require('../types');
const copyProps = require('./copyprops');
const getProp = require('./getproperty');
 
 /**
  * Clone an object or function.
  *
  * @param {object} obj - The object we want to clone.
  * 
  * @param {(object|number)} [opts={}] Options for the cloning process.
  * 
  *   If this is a `number` then it's assumed to be the `opts.mode` parameter.
  * 
  * @param {number} [opts.mode=CLONE.DEF] One of the `CLONE.*` enum values.
  * 
  *   When the `clone()` method was written to replace some similar methods
  *   from earlier libraries, I for some reason decided to simply have a bunch
  *   of different cloning modes. I have since added a full set of options that
  *   allows overriding the options of any mode (except `CLONE.JSON`).
  * 
  *   The `CLONE` enum is also aliased as `clone.MODE` as an alternative.
  * 
  * @param {boolean} [opts.all] Clone **all** of the object's properties?
  * 
  *   If `false` only *enumerable* properties will be cloned.
  * 
  *   The default value depends on the `opts.mode` used.
  * 
  *   This is not used if `opts.mode` was `CLONE.JSON`.
  *
  * @param {boolean} [opts.slice] Use the `Array.slice()` shortcut?
  * 
  *   If `true` then when cloning `Array` objects, a shallow clone will be
  *   created using the `Array.slice()` method.
  * 
  *   The default value depends on the `opts.mode` used.
  * 
  *   This is not used if `opts.mode` was `CLONE.JSON`.
  * 
  * @param {boolean} [opts.recursive] Clone nested objects recursively?
  * 
  *   The default value depends on the `opts.mode` used.
  *   If `opts.slice` is also `true` then `Array` objects will
  *   be *shallow clones* while any other kind of object will be recursive.
  * 
  *   This is not used if `opts.mode` was `CLONE.JSON`.
  * 
  * @param {boolean} [opts.descriptors] Clone using the property descriptors?
  * 
  *   If `true` we will get the property descriptors from the original object,
  *   and assign them to the clone.
  *   This is the only way to clone *accessor* type properties properly.
  * 
  *   If `false` we will directly assign the *property value* from the original
  *   object into the clone. This means the *current value* returned from an
  *   *accessor* type property will be assigned statically to the clone.
  * 
  *   The default value will be `true` if `opts.all` **OR** `opts.recursive`
  *   are `true`. It will be `false` otherwise.
  * 
  *   This is not used if `opts.mode` was `CLONE.JSON`.
  * 
  * @param {boolean} [opts.prototype] Set the clone's `prototype`?
  * 
  *   If `true`, once the cloning is complete, we will call
  *   `Object.getPrototypeOf()` on the original `obj`, and then call
  *   `Object.setProrotypeOf()` on the clone.
  *  
  *   If `false` then the clone with have a prototype of `Object` or
  *   `Array` depending on whether the original object was an `Array`
  *   or not. No further prototype handling will be done.
  * 
  *   The default value will be `true` if `opts.all` **AND** `opts.recursive`
  *   are *both* `true`. Otherwise the default value is `false`.
  *   So for *modes*, only `CLONE.ENTIRE` uses this by default.
  * 
  * @param {(object|boolean)} [opts.addClone=false] 
  *   Call `addClone()` on the cloned object.
  *
  *   If `opts.addClone` is an `object` then it will be used as the options
  *   passed to the `addClone()` method. If it is `true` then the `opts`
  *   will be passed as is.
  *
  * @param {(object|boolean)} [opts.addLock=false] 
  *   Call `addLock()` on the cloned object.
  *
  *   If `opts.addLock` is an `object` then it will be used as the options
  *   passed to the `addLock()` method. If it is `true` then the `opts`
  *   will be passed as is.
  *
  * @param {(object|boolean)} [opts.copy=false] 
  *   Call `copyProps()` on the cloned object.
  *
  *   This is called *after* the normal cloning process, so only properties
  *   that weren't copied during the cloning process will be copied here.
  *   This is a leftover from when `CLONE.JSON` was the default cloning mode,
  *   and this was the only way to restore `function` properties.
  * 
  *   If `opts.copy` is an `object` then it will be used as the options
  *   passed to the `copyProps()` method. If it is `true` then the `opts`
  *   will be passed as is.
  *
  * @return {object} The clone of the object.
  * 
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

  if (typeof opts === N)
  { // The 'mode' option.
    opts = {mode: opts};
  }
  else if (!isObj(opts))
  { // Opts has to be a valid object.
    opts = {};
  }

  // The mode is the base option.
  const mode = typeof opts.mode === N ? opts.mode : CLONE.DEF;

  // Options with defaults based on the mode.
  const allProps  = opts.all       ?? ALL_PROPS.includes(mode);
  const useSlice  = opts.slice     ?? SLICE_ARRAYS.includes(mode);
  const recursive = opts.recursive ?? RECURSIVE.includes(mode);

  // Some that depend on the values of the above options.
  const descriptors = opts.descriptors ?? (allProps || recursive);
  const withProto   = opts.prototype   ?? (allProps && recursive);

  // Finally, a few that can be boolean or objects.
  const subOpts = opt => 
  {
    if (isObj(opts[opt]))
      return opts[opt];
    else if (opts[opt] === true)
      return opts;
  }
  const reclone = subOpts('addClone');
  const relock  = subOpts('addLock');
  const cpProps = subOpts('copy');

  let copy;

  //console.debug("::clone", {mode, reclone, relock});

  if (mode === CLONE.JSON)
  { // Deep clone enumerable properties using JSON trickery.
    //console.debug("::clone using JSON cloning");
    copy = JSON.parse(JSON.stringify(obj));
  }
  else if (Array.isArray(obj) && useSlice)
  { // Make a shallow copy using slice.
    //console.debug("::clone using Array.slice()");
    copy = obj.slice();
  }
  else
  { // Build a clone using a simple loop.
    //console.debug("::clone using simple loop");
    copy = isArray(obj) ? [] : {};

    let props;
    if (allProps)
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

    let recOpts;
    if (recursive)
    { // Recursive opts; skips addClone, addLock, and copy.
      recOpts =
      {
        mode, recursive, descriptors,
        all: allProps,
        slice: useSlice,
        prototype: withProto,
      }
    }
    
    for (const prop of props)
    {
      if (descriptors)
      { // Use descriptor assignment.
        const objDesc = getProp(obj, prop);
        if (isObj(objDesc))
        { // Make a fast, shallow clone of the descriptor.
          const cloneDesc = clone(objDesc);
          if (isObj(objDesc.value) && recursive)
          { // Recursively clone the value.
            cloneDesc.value = clone(objDesc.value, recOpts);
          }
          def(copy, prop, cloneDesc);
        }
        else 
        {
          console.error("getProperty failed", {obj, prop, props, opts});
        }
      }
      else 
      { // Use direct assignment.
        let val = obj[prop];
        if (isObj(val) && recursive)
        { // Deep cloning.
          val = clone(val, recOpts);
        }
        copy[prop] = val;
      }
    } // for prop

  } // simple loop cloning algorithm

  if (withProto)
  { // Copy the prototype if it is different.
    const objProto = Object.getPrototypeOf(obj);
    const copyProto = Object.getPrototypeOf(copy);
    if (objProto && objProto !== copyProto)
    { // Update the clone's prototype to match the original.
      Object.setPrototypeOf(copy, objProto);
    }
  }

  if (isObj(reclone))
  { // Add the clone() method to the clone, with the passed opts as defaults.
    addClone(copy, reclone);
  }

  if (isObj(relock))
  { // Add the lock() method to the clone.
    addLock(copy, relock);
  }

  if (isObj(cpProps))
  { // Pass the clone through the copyProps() function as well.
    copyProps(obj, copy, cpProps);
  }

  return copy;
}

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
    defOpts = {addClone: true};
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
  * **NOTE**: A newer replacement for this function exists, see
  * {@link module:@lumjs/core/obj.unlocked} for details.
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

// And setting all the Enum definitions at the very end.
const Enum = require('../enum');

/**
 * An `enum` of supported *modes* for the `clone()` method.
 * 
 * - **P** → All properties. If unchecked, *enumerable* properties only.
 * - **A** → Uses `Array.slice()` shortcut for shallow `Array` cloning.
 * - **R** → Recursive (deep) cloning of nested objects.
 * - **D** → Uses *descriptor* cloning instead of direct assignment.
 * - **T** → Sets the `prototype` of the clone as well. 
 * 
 * | Mode | P | A | R | D | T | Notes |
 * | ---- | - | - | - | - | - | ----- |
 * | `CLONE.N` | × | × | × | × | × | Can be used to manually specify options. |
 * | `CLONE.DEF` | × | ✓ | × | × | × | Default mode for cloning functions. |
 * | `CLONE.DEEP` | × | × | ✓ | ✓ | × | |
 * | `CLONE.FULL` | ✓ | ✓ | × | ✓ | × | |
 * | `CLONE.ALL` | ✓ | × | × | ✓ | × | |
 * | `CLONE.ENTIRE` | ✓ | × | ✓ | ✓ | ✓ | |
 * | `CLONE.JSON` | - | - | ✓ | - | × | Uses JSON, so no `function` or `symbol` support. |
 * 
 * The `✓` and `×` marks signify the *default settings* in the mode.
 * In *most* cases there are options that can override the
 * defaults.
 * 
 * Any feature in the `CLONE.JSON` row marked with `-` are
 * incompatible with that mode and cannot be enabled at all.
 * 
 * @alias module:@lumjs/core/obj.CLONE
 */
 const CLONE = Enum(['N','DEF','FULL','ALL','DEEP','ENTIRE','JSON']);

 exports.CLONE = CLONE;

 // A list of modes that should use the array.slice shallow shortcut.
 const SLICE_ARRAYS = [CLONE.DEF, CLONE.FULL];

 // A list of modes that should get *all* properties.
 const ALL_PROPS = [CLONE.FULL, CLONE.ALL, CLONE.ENTIRE];

 // A list of modes that should do recursive cloning of objects.
 const RECURSIVE = [CLONE.DEEP, CLONE.ENTIRE];

// Alias the CLONE enum as clone.MODE
def(clone, 'MODE', CLONE);
