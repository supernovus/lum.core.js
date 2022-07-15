const {O, F, S, SY} = require('./js');

/**
 * See if a value is a non-null `object`.
 * @param {*} v - The value we're testing.
 * @returns {boolean}
 */
 function isObj(v) { return (typeof v === O && v !== null); }

 /**
  * See if a value is *complex* (i.e. either `object` or `function`).
  * Like `isObj()`, `null` does not count as an `object`.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  */
 function isComplex(v) { return (typeof v === F || isObj(v)); }
 
 /**
  * See if a value is *nil* (i.e. either `null` or `undefined`).
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  */
 function isNil(v) { return (v === undefined || v === null); }
 
 /**
  * See if a value is not *nil* (i.e. neither `null` nor `undefined`).
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  */
 function notNil(v) { return (v !== undefined && v !== null); }
 
 /**
  * See if a value is a scalar.
  * For the purposes of this, a scalar is any value which
  * is neither *nil* nor *complex*.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  */
 function isScalar(v) { return (notNil(v) && !isComplex(v)); }
 
 /**
  * See if a value is an `Array` object.
  * This is literally just a copy of `Array.isArray`.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  */
 const isArray = Array.isArray;
 
 /**
  * See if a value is a `TypedArray` object.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  */
 function isTypedArray(v)
 {
   return (ArrayBuffer.isView(v) && !(v instanceof DataView));
 }
 
 /**
  * See if a value is a non-empty Array.
  * @param {*} v - The value we're testing.
  * @param {boolean} [typed=false] If `true` we want a `TypedArray`.
  *   If `false` (default) we want a regular `Array`.
  * @returns {boolean}
  */
 function nonEmptyArray(v, typed=false)
 {
   if (typed)
     return (isTypedArray(v) && v.length > 0);
   else
     return (isArray(v) && v.length > 0);
 }
 
 /**
  * See if a value is an `arguments` object.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  */
 function isArguments(v) 
 {
   return Object.prototype.toString.call(v) === '[object Arguments]';
 }

 /**
 * See if a value is a Property name.
 * @param {*} v - The value we're testing.
 * @returns {boolean}
 */
function isProperty(v)
{
  const t = typeof v;
  return (t === S || t === SY);
}

/**
 * See if an object can be used as a valid descriptor.
 * 
 * Basically in order to be considered a valid descriptor, 
 * one of the the following sets of rules must be true:
 * 
 *  - A Data Descriptor:
 *      - Has a `value` property.
 *      - Does not have a `get` property.
 *      - Does not have a `set` property.
 *  - An Accessor Descriptor:
 *      - Has a `get` and/or `set` property.
 *      - Does not have a `value` property.
 *      - Does not have a `writable` property.
 * 
 * @param {object} obj - The object we are testing. 
 * @returns {boolean} - Is the object a valid descriptor?
 */
 function doesDescriptor(obj)
 {
   if (isObj(obj))
   {
     const hasValue    = (obj.value !== undefined);
     const hasGetter   = (typeof obj.get === F);
     const hasSetter   = (typeof obj.set === F);
     const hasWritable = (obj.writable !== undefined);
 
     if (hasValue && !hasGetter && !hasSetter)
     { // We have a value, and no getter or setter.
       return true;
     }
     else if ((hasGetter || hasSetter) && !hasValue && !hasWritable)
     { // We have a getter or setter, and no value or writable properties.
       return true;
     }
   }
 
   // Nothing matched, not a valid descriptor rule.
   return false;
 }

 // Now export those.
 module.exports =
 {
  isObj, isComplex, isNil, notNil, isScalar, isArray, isTypedArray,
  nonEmptyArray, isArguments, isProperty, doesDescriptor,
 }
 