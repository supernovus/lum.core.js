const {O, F, S, SY} = require('./js');

/**
 * See if a value is a non-null `object`.
 * @param {*} v - The value we're testing.
 * @returns {boolean}
 * @alias module:@lumjs/core/types.isObj
 */
 function isObj(v) { return (typeof v === O && v !== null); }

 /**
  * See if a value is *complex* (i.e. either `object` or `function`).
  * Like `isObj()`, `null` does not count as an `object`.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  * @alias module:@lumjs/core/types.isComplex
  */
 function isComplex(v) { return (typeof v === F || isObj(v)); }
 
 /**
  * See if a value is *nil* (i.e. either `null` or `undefined`).
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  * @alias module:@lumjs/core/types.isNil
  */
 function isNil(v) { return (v === undefined || v === null); }
 
 /**
  * See if a value is not *nil* (i.e. neither `null` nor `undefined`).
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  * @alias module:@lumjs/core/types.notNil
  */
 function notNil(v) { return (v !== undefined && v !== null); }
 
 /**
  * See if a value is a scalar.
  * For the purposes of this, a scalar is any value which
  * is neither *nil* nor *complex*.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  * @alias module:@lumjs/core/types.isScalar
  */
 function isScalar(v) { return (notNil(v) && !isComplex(v)); }
 
 /**
  * See if a value is an `Array` object.
  * This is literally just a copy of `Array.isArray`.
  * @function
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  * @alias module:@lumjs/core/types.isArray
  */
 const isArray = Array.isArray;
 
 /**
  * See if a value is a `TypedArray` object.
  * @param {*} v - The value we're testing.
  * @returns {boolean}
  * @alias module:@lumjs/core/types.isTypedArray
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
  * @alias module:@lumjs/core/types.nonEmptyArray
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
  * @alias module:@lumjs/core/types.isArguments
  */
 function isArguments(v) 
 {
   return Object.prototype.toString.call(v) === '[object Arguments]';
 }

 /**
 * See if a value is a Property name.
 * @param {*} v - The value we're testing.
 * @returns {boolean}
 * @alias module:@lumjs/core/types.isProperty
 */
function isProperty(v)
{
  const t = typeof v;
  return (t === S || t === SY);
}

/**
 * See if an object can be used as a valid *descriptor*.
 * 
 * Basically in order to be considered a valid *descriptor*, 
 * one of the the following sets of rules must be true:
 * 
 *  - A *Data descriptor*:
 *      - Has a `value` property.
 *      - Does not have a `get` property.
 *      - Does not have a `set` property.
 *  - An *Accessor descriptor*:
 *      - Has a `get` and/or `set` property.
 *      - Does not have a `value` property.
 *      - Does not have a `writable` property.
 * 
 * @param {object} obj - The object we are testing. 
 * @returns {boolean} - Is the object a valid descriptor?
 * @alias module:@lumjs/core/types.doesDescriptor
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

/**
 * See if an object can be used as a valid *descriptor template*.
 * 
 * This is similar to `doesDescriptor`, except that a *template*
 * **must not** contain `value`, `get` or `set` properties.
 * 
 * @param {object} obj - The object we are testing.
 * @param {boolean} [accessor=false] Template is for an Accessor.
 *   If this is `true` then the `writable` property will also be forbidden.
 * @param {boolean} [strict=true] Only allow valid descriptor properties.
 *   If this is `true` then **only** allow `configurable`, `enumerable`, and
 *   conditionally `writable` (only if `accessor` is `false`.)
 *   If this is `false` then any unknown properties will be ignored.
 * 
 * @returns {boolean} Is the object a valid descriptor template?
 * @alias module:@lumjs/core/types.doesDescriptorTemplate
 */
function doesDescriptorTemplate(obj, accessor=false, strict=true)
{
  if (!isObj(obj)) return false;

  // Get a list of enumerable properties in the object.
  const props = Object.keys(obj);

  if (strict)
  { // Strict enforcement, only valid descriptor properties allowed.
    const valid = ['configurable', 'enumerable'];
    if (!accessor) valid.push('writable');
    for (const prop of props)
    {
      if (!valid.includes(prop)) return false;
    }
  }
  else
  { // Loose enforcement mode, reject on forbidden properties only.
    const forbidden = ['value','get','set'];
    if (accessor) forbidden.push('writable');
    for (const prop of props)
    {
      if (forbidden.includes(prop)) return false;
    }
  }

  // No tests failed, this can be used as a template.
  return true;
}

// Now export those.
module.exports =
{
isObj, isComplex, isNil, notNil, isScalar, isArray, isTypedArray,
nonEmptyArray, isArguments, isProperty, doesDescriptor, doesDescriptorTemplate,
}
