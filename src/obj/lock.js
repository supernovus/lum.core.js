// Import *most* required bits here.
const {B, isObj, def} = require('../types');
const {getDescriptor, DESC} = require('../descriptors');

/**
 * Lock an object using Object.freeze()
 *
 * @param {object} obj - The object we want to lock.
 * @param {boolean} [clonable=true] Pass to {@link Lum._.addClone} first?
 * @param {object} [cloneOpts=null] Options for addClone.
 * @param {boolean} [useSeal=false] Use Object.seal() instead of freeze.
 *
 * If cloneOpts is `null` then we will use the following:
 *
 * ```{mode: CLONE.DEF, addClone: true, addLock: true}```
 *
 * @return {object} The locked object.
 *
 * @method Lum._.lock
 */
 function lock(obj, clonable=true, cloneOpts=null, useSeal=false)
 {
   if (clonable)
   { // Add the clone method before freezing.
     if (!isObj(cloneOpts))
     {
       cloneOpts = {mode: CLONE.DEF, addClone: true, addLock: true};
     }
     addClone(obj, cloneOpts);
   }
 
   // Now freeze (or seal) the object.
   return (useSeal ? Object.seal(obj) : Object.freeze(obj));
 }
 
 exports.lock = lock;
 
 /**
  * Add a lock() method to an object.
  *
  * Adds a wrapper version of {@link Lum._.lock} to the object as a method.
  *
  * @param {object} obj - The object we're adding lock() to.
  * @param {object} opts - Options (TODO: document this).
  *
  * @method Lum._.addLock
  */
 function addLock(obj, opts)
 {
   const defDesc = getDescriptor(opts.lockDesc ?? DESC.CONF);
   defDesc.setValue(function(obj, cloneable, cloneOpts, useSeal)
   {
     if (typeof cloneable !== B) clonable = opts.addClone ?? true;
     if (!isObj(cloneOpts)) cloneOpts = opts; // Yup, just a raw copy.
     if (typeof useSeal !== B) useSeal = opts.useSeal ?? false;
     return lock(obj, cloneable, cloneOpts, useSeal);
   });
   return def(obj, 'lock', defDesc);
 }
 
 exports.addLock = addLock;

 // Importing addLock at the end, just because.
 const {addClone} = require('./clone');