/// Type checking and other features common to everything else.

// Constants representing core Javascript types.
const O='object', F='function', S='string', B='boolean', N='number',
      U='undefined', SY='symbol', BI='bigint';

/**
 * A map of type names including special and union types.
 */
const TYPES =
{
  O, F, S, B, N, U, SY, BI, ARGS: 'arguments', ARRAY: 'array', NULL:'null', 
  TYPEDARRAY: 'typedarray', DESCRIPTOR: 'descriptor', COMPLEX: 'complex', 
  SCALAR: 'scalar', PROP: 'property',
}

/**
 * A flat array of the type names supported in the `TYPES` constant.
 */
const TYPE_LIST = [];
for (const t in TYPES) { TYPE_LIST.push(TYPES[t]); }

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
 * See if a value is an instance of a class.
 * @param {*} v - The value we're testing.
 * @param {function} f - The constructor/class we want.
 * @returns {boolean}
 */
function isInstance(v, f, needProto=false) 
{
  if (!isObj(v)) return false; // Not an object.
  if (needProto && (typeof v.prototype !== O || v.prototype === null))
  { // Has no prototype.
    return false;
  }

  if (typeof f !== F || !(v instanceof f)) return false;

  // Everything passed.
  return true;
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
 * A smarter `typeof` function.
 * 
 * @param {string} type - The type we're checking for.
 * 
 * This supports all the same type names as `typeof` plus:
 * 
 * - `arguments`   → An arguments object inside a function.
 * - `array`       → An Array object.
 * - `null`        → A null value.
 * - `typedarray`  → One of the typed array objects.
 * - `descriptor`  → An object which is a valid descriptor.
 * - `complex`     → Either an `object` or a `function.
 * - `scalar`      → Anything other than an `object` or `function`.
 * - `property`    → A `string` or a `symbol`.
 * 
 * One other thing, while `typeof` reports `null` as being an `object`,
 * this function does not count `null` as a valid `object`. 
 * 
 * @param {*} v - The value we're testing. 
 * 
 * @returns {boolean} If the value was of the desired type.
 */
function isType(type, v)
{
  if (typeof type !== S || !TYPE_LIST.includes(type))
  {
    throw new TypeError(`Invalid type ${JSON.stringify(type)} specified`);
  }

  switch(type)
  {
    case O:
      return isObj(v);
    case TYPES.NULL:
      return (v === null);
    case TYPES.ARGS:
      return isArguments(v);
    case TYPES.ARRAY:
      return isArray(v);
    case TYPES.TYPEDARRAY:
      return isTypedArray(v);
    case TYPES.DESCRIPTOR:
      return doesDescriptor(v);
    case TYPES.COMPLEX:
      return isComplex(v);
    case TYPES.SCALAR:
      return isScalar(v);
    case TYPES.PROP:
      return isProperty(v);
    default:
      return (typeof v === type);
  }
}

/**
 * If a value is not an object, throw an error.
 * 
 * @param {*} v - The value we're testing.
 * @param {boolean} [allowFunc=false] - Also accept functions?
 * @param {string} [msg] A custom error message.
 * @throws {TypeError} If the type check failed.
 */
function needObj (v, allowFunc=false, msg=null)
{
  if (allowFunc && isComplex(v)) return;
  if (isObj(v)) return;

  if (typeof msg !== S)
  { // Use a default message.
    msg = "Invalid object";
    if (allowFunc)
      msg += " or function";
  }
  throw new TypeError(msg);
}

/**
 * If a value is not a certain type, throw an error.
 * 
 * @param {string} type - The type name as per `isType`.
 * @param {*} v - The value we're testing.
 * @param {string} [msg] A custom error message.
 * @throws {TypeError} If the type check failed.
 */
function needType (type, v, msg, unused)
{
  if (!isType(type, v))
  {
    if (typeof msg === B)
    {
      console.warn("needType(): 'allowNull' is no longer supported");
      if (typeof unused === S)
      { // Compatibility with old code.
        msg = unused;
      }
    }

    if (typeof msg !== S)
    { // Use a default message.
      msg = `Invalid ${type} value`;
    }

    throw new TypeError(msg);
  }
}

/** 
 * See if an array contains *any* of the specified items.
 * @param {Array} array 
 * @param  {...any} items 
 * @returns {boolean}
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

/**
 * See if an array contains *all* of the specified items.
 * @param {Array} array 
 * @param  {...any} items 
 * @returns {boolean}
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

/**
 * Remove items from an array.
 * @param {Array} array 
 * @param  {...any} items 
 * @returns {number} Number of items removed.
 */
function removeFromArray(array, ...items)
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

// «private»
function no_root()
{
  throw new Error("Invalid JS environment, no root object found");
}

/**
 * The global root object. Usually `globalThis` these days.
 */
const root = typeof globalThis !== U ? globalThis
  : typeof global !== U ? global 
  : typeof self !== U ? self 
  : typeof window !== U ? window 
  : no_root(); // Unlike the old way, we'll die if the environment is undetermined.

// A list of objects to be considered unbound globally.
const unboundObjects = [];

/**
 * Pass `this` here to see if it is bound to an object.
 * 
 * Always considers `null` and `undefined` as unbound.
 * 
 * @param {*} whatIsThis - The `this` from any context.
 * @param {boolean} [rootIsUnbound=true] The global root is unbound. 
 * @param {(boolean|Array)} [areUnbound=false] A list of unbound objects.
 *   If the is `true` we use an global list that can register special
 *   internal objects. Otherwise an `Array` of unbound objects may be used.
 * @returns {boolean}
 */
function unbound(whatIsThis, rootIsUnbound=true, areUnbound=false)
{
  if (areUnbound === true)
  { // If areUnbound is true, we use the unboundObjects 
    areUnbound = unboundObjects;
  }

  if (isNil(whatIsThis)) return true;
  if (rootIsUnbound && whatIsThis === root) return true;
  if (isArray(areUnbound) && areUnbound.includes(whatIsThis)) return true;

  // Nothing considered unbound.
  return false;
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

/**
 * A minimalistic wrapper around `Object.defineProperty()`.
 * 
 * This is not meant to be fancy, it simply changes a few default
 * behaviours, and makes assigning simple non-accessor properties simpler.
 * 
 * See the `prop()` function which expands on this with many more features.
 * 
 * @param {(object|function)} obj - The object to add a property to.
 * @param {?(string|boolean)} name - The name of the property we're adding.
 * 
 *   If this is `null` or `undefined` then the `value` is ignored entirely,
 *   and instead a bound version of this function is created with the
 *   `obj` already passed as the first parameter. Can be useful if you
 *   need to add a lot of properties to the same object.
 * 
 *   If this is a `boolean` value instead of a string, then the same logic
 *   as if it was `null` or `undefined` will apply, except that an
 *   `enumerable` property with this value will be added to the descriptors.
 * 
 * @param {*} value - Used to determine the value of the property.
 * 
 *   If it is an a valid descriptor object (as per `doesDescriptor()`),
 *   it will be used as the descriptor. If it has no `configurable`
 *   property defined, one will be added, and will be set to `true`.
 * 
 *   Any other value passed here will be used as the `value` in a
 *   pre-canned descriptor, also with `configurable` set to `true`.
 * 
 * @returns {*} Normally the `obj` argument with new property added.
 * 
 *   The exception is if this is a bound copy of the function created
 *   using the syntax described in the `name` parameter documentation.
 *   In that case the return value is the bound copy itself.
 *   While that might seem strange, it allows for chaining in a way
 *   that otherwise would not be possible, take this example:
 * 
 * ```
 *   def(myObj)('name', "Bob")('age', 42);
 * ```
 * 
 */
function def(obj, name, value)
{
  if (isNil(name) || typeof name === B)
  { // Create a bound function, and return it.
    const opts = {obj, enumerable: name};
    // Yes, we're creating a circular reference.
    opts.bound = def.bind(opts, obj);
    // The reason why will be obvious later.
    return opts.bound;
  }
  else if (!isProperty(name))
  { // That's not valid.
    throw new TypeError("property name must be a string or a Symbol");
  }

  const isBound = !unbound(this, true, true);
  let desc;

  if (doesDescriptor(value))
  { // The value is a descriptor, let's use it.
    desc = value;
    if (typeof desc.configurable !== B)
    { // No valid 'configurable' property, we default to true.
      desc.configurable = true;
    }
  }
  else 
  { // The value is just a value, so let's assign it.
    desc = {configurable: true, value};
  }

  if (isBound 
    && typeof this.enumerable === B 
    && typeof desc.enumerable !== B)
  { // We have an enumerable value, and the desc does not.
    desc.enumerable = this.enumerable;
  }

  // Add the property.
  Object.defineProperty(obj, name, desc);

  if (isBound && typeof this.bound === F)
  { // Bound version, returns itself recursively.
    return this.bound;
  }
  else 
  { // Not bound, or doesn't have a reference to itself.
    return obj;
  }
} // def()

/**
 * Add an item to the unbound global objects list.
 * 
 * @method unbound.add 
 * 
 * @param {(object|function)} obj - The object to be considered unbound.
 * 
 * @returns {boolean} Will be `false` if `obj` is already unbound.
 * 
 * @throws {TypeError} If `obj` was neither an `object` nor a `function`.
 */
def(unbound, 'add', function (obj)
{
  needObj(obj, true);
  if (unbound(obj, true, true))
  { // Item is already unbound.
    return false;
  }
  // Add to list and we're done.
  unboundObjects.push(obj);
  return true;
});

/**
 * Remove an item from the unbound global objects list.
 * 
 * @method unbound.remove
 * 
 * @param {(object|function)} obj - The object to be removed.
 * 
 * @returns {boolean} Will be `false` if the item was not in the list.
 * 
 * @throws {TypeError} If `obj` was neither an `object` nor a `function`.
 */
def(unbound, 'remove', function(obj)
{
  needObj(obj, true);
  return (removeFromArray(unboundObjects, obj) > 0);
});

/**
 * A placeholder function for when something is not implemented.
 * 
 * @param {boolean} [fatal=true] - If `true` throw an `Error`.
 *   If `false` just uses `console.error()` instead.
 * @returns {void}
 */
function NYI(fatal=true) 
{ 
  const msg = "Not yet implemented";
  if (fatal)
    throw new Error(msg);
  else
    console.error(msg);
}

// Okay, add all those to our exports.
module.exports =
{
  root, O, F, S, B, N, U, SY, BI, TYPES, TYPE_LIST, isType, NYI,
  isObj, isNil, notNil, isComplex, isInstance, isArguments, isScalar,
  isProperty, isArray, isTypedArray, nonEmptyArray, needObj, needType,  
  containsAny, containsAll, removeFromArray, doesDescriptor, def, unbound,
}
