// Import *most* required bits here.
const {B,N,F, isObj, isComplex, def} = require('../types');
const Enum = require('../enum');
const {getDescriptor, DESC} = require('../descriptors');
const copyProps = require('./copyprops');

/**
 * An enum of supported modes for the `clone` method.
 * 
 * `CLONE.DEFAULT` → Shallow clone of enumerable properties for most objects.
 * `CLONE.JSON`    → Deep clone using JSON serialization (Arrays included.)
 * `CLONE.FULL`    → Shallow clone of all object properties.
 * `CLONE.ALL`     → Shallow clone of all properties (Arrays included.)
 * 
 */
 const CLONE = Enum(['DEF','JSON','FULL','ALL']);

 exports.CLONE = CLONE;
 
 /**
  * Clone an object or function.
  *
  * @param {object|function} obj - The object we want to clone.
  * @param {object} [opts={}] - Options for the cloning process.
  * 
  * @param {number} [opts.mode=MODE_DEFAULT] - One of the `CLONE.*` enum values.
  *
  *   For any mode that doesn't saay "Arrays included", Array objects will
  *   use a shortcut technique of `obj.slice()` to create the clone.
  * 
  *   Note: The `CLONE` enum is also aliased as `clone.MODE` as an alternative.
  *
  * @param {boolean} [opts.addClone=false] - Call {@link Lum._.addClone} on the cloned object.
  *
  *   The options sent to this function will be used as the defaults in
  *   the clone() method added to the object.
  *
  * @param {boolean} [opts.addLock=false] - Call {@link Lum._.addLock} on the cloned object.
  *
  *   No further options for this, just add a lock() method to the clone.
  *
  * @param {?object} [opts.copy] Call {@link Lum._.copy} on the cloned object.
  *
  *   Will pass the original `obj` as the source to copy from.
  *   Will pass `opts.copy` as the options.
  *
  * @return {object} - The clone of the object.
  */
 function clone(obj, opts={}) 
 {
   //console.debug("Lum~clone()", obj, opts);
 
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
   else if (mode !== CLONE.ALL && Array.isArray(obj))
   { // Make a shallow copy using slice.
     //console.debug("::clone using Array.slice()");
     copy = obj.slice();
   }
   else
   { // Build a clone using a simple loop.
     //console.debug("::clone using simple loop");
     copy = {};
 
     let props;
     if (mode === CLONE.ALL || mode === CLONE.FULL)
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
 
     for (let p = 0; p < props.length; p++)
     {
       let prop = props[p];
       copy[prop] = obj[prop];
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
  * @method Lum._.addClone
  */
 function addClone(obj, defOpts=null)
 {
   if (!isObj(defOpts))
   { // Assign a default set of defaults.
     defOpts = {mode: CLONE.DEF, addClone: true, addLock: false};
   }
 
   const defDesc = getDescriptor(defOpts.cloneDesc ?? DESC.CONF);
 
   defDesc.setValue(function (opts)
   {
     if (!isObj(opts)) 
       opts = defOpts;
     return clone(obj, opts);
   });
 
   return def(obj, 'clone', defDesc);
 }
 
 exports.addClone = addClone; 
 
 /**
  * Clone an object if it's not extensible (locked, sealed, frozen, etc.)
  *
  * If the object is extensible, it's returned as is.
  *
  * If not, if the object has a `clone()` method it will be used.
  * Otherwise use the {@link Lum._.clone} method.
  *
  * @param {object} obj - The object to clone if needed.
  * @param {object} [opts] - Options to pass to `clone()` method.
  *
  * @return {object} - Either the original object, or an extensible clone.
  *
  * @method Lum._.cloneIfLocked
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
