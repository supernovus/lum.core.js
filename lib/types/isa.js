const {O, F, S} = require('./js');
const {isObj,isArray} = require('./basics');
const TYPES = require('./typelist');

/**
 * See if a value is an instance of a class.
 * @param {*} v - The value we're testing.
 * @param {function} f - The constructor/class we want.
 * @param {boolean} [needProto=false] If true, the `v` must have a `prototype`.
 * @returns {boolean}
 * @alias module:@lumjs/core/types.isInstance
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
 
exports.isInstance = isInstance;

/**
 * A smarter `typeof` function.
 * 
 * @param {string} type - The type we're checking for.
 * 
 * This supports all the same type names as `typeof` plus any of
 * the properties defined in the `TYPES` object.
 * 
 * One other thing, while `typeof` reports `null` as being an `object`,
 * this function does not count `null` as a valid `object`. 
 * 
 * @param {*} v - The value we're testing. 
 * @returns {boolean} If the value was of the desired type.
 * @alias module:@lumjs/core/types.isType
 */
function isType(type, v)
{
  if (typeof type !== S || !TYPES.list.includes(type))
  {
    throw new TypeError(`Invalid type ${JSON.stringify(type)} specified`);
  }

  if (typeof TYPES.tests[type] === F)
  { // A type-specific test.
    return TYPES.tests[type](v);
  }
  else 
  { // No type-specific tests.
    return (typeof v === type);
  }
}
 
exports.isType = isType;

// Default options parser.
const DEFAULT_ISA_PARSER = function(type, v)
{ // `this` is the options object itself.
  if (typeof type.is === F)
  { // We assume `is()` methods are the type check.
    if (type.is(v)) return true;
  }

  if (typeof type.isa === O)
  { // Process our known options.
    const opts = type.isa;

    if (typeof opts.process === F)
    { // Run a method to extend the options further.
      opts.process(this, v, type);
    }

    if (typeof opts.parsers === F)
    { // Assign another parser.
      this.parsers.push(opts.parsers);
    }

    if (typeof opts.test === F)
    { // A custom test, will be passed `v` and the current `opts`.
      if (opts.test(v, this))
      { // Mark this as having passed.
        return true;
      }
    }

    // Okay, now anything else gets set.
    const RESERVED = ['parsers','process','test'];
    for (const opt in opts)
    {
      if (RESERVED.includes(opt)) continue; // Skip it.
      this[opt] = opts[opt];
    }

  }

  // We should almost always return false.
  return false;
}

// Process further options
function processOptions(type, v)
{
  for (const parser of this.parsers)
  {
    if (typeof parser === F)
    {
      if (parser.call(this, type, v) === true)
      { // Returning true means a custom test passed.
        return true;
      }
    }
  }
  return false;
}

/**
 * Is value a certain type, or an instance of a certain class.
 * 
 * @param {*} v - The value we're testing.
 * @param {...any} types - The types the value should be one of.
 * 
 * For each of the `types`, by default if it is a `string` 
 * we test with `isType()`, if it is a `function` we test with `isInstance()`.
 * 
 * If it is an `object` and has an `is()` method, use that as the test.
 * 
 * If it is an `object` it will be passed to the current options parsers.
 * The default options parser looks for an `object` property called `isa`,
 * which supports the following child properties:
 * 
 *  - `needProto: boolean`, Change the `needProto` option for `isInstance()`
 *  - `parsers: function`, Add another options parser function.
 *  - `process: function`, A one-time set-up function.
 *  - `test: function`, Pass the `v` to this test and return `true` if it passes.
 *  - `typeof: boolean`, If `true` use `typeof` instead of `isType()` for tests.
 *  - `instanceof: boolean`, If `true` use `instanceof` instead of `isInstance()`.
 *  - Anything else will be set as an option that may be used by other parsers.
 * 
 * Any other type value will only match if `v === type`
 * 
 * @returns {boolean} Was the value one of the desired types?
 * @alias module:@lumjs/core/types.isa
 */
function isa(v, ...types)
{
  // A special options object.
  const opts =
  {
    needProto: false,
    parsers: [DEFAULT_ISA_PARSER],
    process: processOptions,
    typeof: false,
    instanceof: false,
  }

  for (const type of types)
  {
    // First a quick test for absolute equality.
    if (v === type) return true;

    // With that out of the way, let's go!
    if (typeof type === S)
    { // A string is passed to isType()
      if (opts.typeof && typeof v === type) return true;
      if (isType(type, v)) return true;
    }
    else if (typeof type === F)
    { // A function is passed to isInstance()
      if (opts.instanceof && v instanceof type) return true;
      if (isInstance(v, type, opts.needProto)) return true;     
    }
    else if (isObj(type))
    { // Objects can be additional tests, or options.
      if (opts.process(type, v)) return true;
    }
  }

  // None of the tests passed. We have failed.
  return false;
}

exports.isa = isa;

/**
 * Extended return value from `isArrayOf()`.
 * 
 * Used if the `opts.details` option was `true`.
 * 
 * @typedef module:@lumjs/core/types~IsArrayOfResult
 * 
 * @prop {boolean} pass - Did the `isArrayOf()` test pass?
 * @prop {boolean} empty - Was the array empty?
 * 
 * @prop {object} [failed] Failure information;
 * Only addedd if `pass` is false.
 * 
 * @prop {number} failed.index - Index of item that caused the failure.
 * Will be set to `-1` if the `opts.value` argument is not an Array, 
 * or if the array is empty and `opts.empty` was not set to `true`.
 * 
 * @prop {mixed} failed.value - The item that caused the failure.
 * Will be the `opts.value` itself if `failed.index` is `-1`.
 * 
 */

/**
 * See if every item in an Array passes an `isa()` test.
 * 
 * @param {(object|Array)} opts - Options for this test function.
 * 
 * If this argument is an `Array` it is assumed to be the
 * `opts.value` named option.
 * 
 * @param {Array} opts.value - The actual Array value to test.
 * @param {boolean} [opts.details=false] Return detailed test results?
 * @param {boolean} [opts.empty=false] Does an empty array pass the test?
 * 
 * @param  {...any} types - See {@link module:@lumjs/core/types.isa}.
 * 
 * All arguments other than `opts` are passed to `isa()` with each item
 * from the `opts.value` array as the subject of the test.
 * 
 * @returns {(boolean|object)} Results of the test.
 * 
 * If `opts.details` was `true` this will be a
 * {@link module:@lumjs/core/types~IsArrayOfResult} object.
 *
 * Otherwise it will be a simple `boolean` value indicating
 * if the test passed or failed.
 * 
 * @alias module:@lumjs/core/types.isArrayOf
 */
function isArrayOf(opts, ...types)
{
  if (!isObj(opts)) return false; // Failure right off the bat!

  if (Array.isArray(opts))
  { // The array subject was passed.
    opts = {value: opts};
  }

  let res; // Format depends on the options.

  if (opts.details)
  {
    res = 
    {
      pass: false,
      empty: false,
      failed:
      {
        index: -1,
        value: val,
      }
    }
  }
  else
  {
    res = false;
  }

  if (!isArray(opts.value)) return res;

  if (opts.value.length === 0)
  { // An empty array.
    if (opts.details)
    {
      res.empty = true;
    }

    if (!opts.empty)
    { // Empty arrays are failure unless `opts.empty` is true.
      return res;
    }
  }
  else
  { // Run the tests on each item.
    for (let i=0; i < opts.value.length; i++)
    {
      const vi = opts.value[i];
  
      if (opts.details)
      {
        res.failed.index = i;
        res.failed.value = vi;
      }
  
      if (!isa(vi, ...types))
      { // An item did not pass the test.
        return res;
      }
    }
  }

  // If we made it here, we passed.
  if (opts.details)
  {
    res.pass = true;
    delete res.failed;
  }
  else
  {
    res = true;
  }

  return res;
}

exports.isArrayOf = isArrayOf;
