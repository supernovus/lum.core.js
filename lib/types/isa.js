"use strict";

const {O, F, S} = require('./js');
const {isObj,isArray,isIterable,notNil} = require('./basics');
const TYPES = require('./typelist');
const def = require('./def');

/**
 * See if a value is an instance of a class.
 * @deprecated Just use `instanceof` directly, this function is unnecessary.
 * @param {*} v - The value we're testing.
 * @param {function} f - The constructor/class we want.
 * @param {boolean} [needProto=false] If true, the `v` must have a `prototype`.
 * @returns {boolean}
 * @alias module:@lumjs/core/types.isInstance
 */
function isInstance(v, f, needProto=false) 
{
  deprecated('types.isInstace','instanceof');
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
 * 
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
  { // A simple custom type test.
    if (type.is(v)) return true;
  }

  if (typeof type.isa === O)
  { // Process our known rules.
    const rules = type.isa;

    if (typeof rules.process === F)
    { // Run a method to extend the options further.
      rules.process(this, v, type);
    }

    if (typeof rules.parsers === F)
    { // Add another parser.
      this.parsers.push(rules.parsers);
    }

    if (typeof rules.test === F)
    { // A more advanced custom type test.
      if (rules.test(v, this, type))
      { // Mark this as having passed.
        return true;
      }
    }

    // Okay, now anything else gets set as an option.
    const RESERVED = ['parsers','process','test'];
    for (const opt in rules)
    {
      if (RESERVED.includes(opt)) continue; // Skip it.
      this[opt] = rules[opt];
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
 * Each of the `type` tests in `types` may be one of:
 * 
 * - `string` → Use `isType()` for the test.
 * - `function` → Assumed to be a class constructor. Will return `true` if:
 *   - `v` is an an `object` instance of the class.
 *   - `v` is a `function` that is in the prototype tree of the class.
 * - `object` → Use `parsers` in {@link module:@lumjs/core/types~IsaOptions}
 *   to attempt to handle the value. These may define custom tests,
 *   or be used to set advanced options.
 * 
 * Any other type value will only match if `v === type`
 * 
 * @returns {boolean} Was the value one of the desired types?
 * 
 * Will be `true` if _any one_ of the tests pass, or `false` if none passed.
 * 
 * @alias module:@lumjs/core/types.isa
 */
function isa(v, ...types)
{
  // A special options object.
  const opts =
  {
    parsers: [DEFAULT_ISA_PARSER],
    process: processOptions,
    instanceof: true,
    needProto: false,
  }

  for (const type of types)
  {
    // First a quick test for absolute equality.
    if (v === type) return true;

    // With that out of the way, let's go!
    if (typeof type === S)
    { // A string is passed to isType()
      if (isType(type, v)) return true;
    }
    else if (typeof type === F)
    { // A function is passed to isInstance()
      if (typeof v === F)
      { // See if it is a sub-class.
        if (type.isPrototypeOf(v)) return true;
      }
      else
      { // See if it is an instance.
        if (opts.instanceof)
        { // Simple test, is default now.
          if (v instanceof type) return true;
        }
        else
        { // Old test, will be removed in the future.
          if (isInstance(v, type, opts.needProto)) return true;
        }
      }
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
 * Options for the `isa()` function.
 * 
 * Only the default options that are supported without using
 * custom `object` parsers are listed below.
 * 
 * @typedef {object} module:@lumjs/core/types~IsaOptions
 * 
 * @prop {module:@lumjs/core/types~IsaParser[]} parsers - Object parsers
 * 
 * These parser functions will be used to handle `object` _type_ values
 * passed to the `isa()` function. The objects can be used to specify
 * custom tests, to modify any of the currently set options, or to
 * extend the functionality of the `isa()` function.
 * 
 * There is one _default_ parser which supports two kinds of objects:
 * 
 * - {@link module:@lumjs/core/types~IsaTest} → Custom type test.
 * - {@link module:@lumjs/core/types~IsaRule} → Custom rules to apply.
 *   Using a rule object is the default way to set options, and the
 *   only supported way to add new parsers.
 * 
 * @prop {function} process - Private/internal method to call parsers
 * 
 * Not meant for external use, this is the method which calls all the
 * current `parsers` whenever an `object` value is passed as a _type_.
 * It uses the same arguments as the parsers themselves.
 * 
 * @prop {boolean} instanceof - Use `instanceof` instead of `isInstance()`
 * 
 * As the `isInstance()` function is DEPRECATED, so is this option.
 * Default: `true` since `v1.22` (was `false` prior to that.)
 * 
 * @prop {boolean} needProto - `needProto` argument for `isInstance()`
 * 
 * Obviously only applicable if `instanceof` option is `false`.
 * As the `isInstance()` function is DEPRECATED, so is this option.
 * Default: `false`
 * 
 */

/**
 * `object` parsers for the `isa()` function.
 * 
 * May be used to support more types of `object` type
 * values passed to the `isa()` function.
 * 
 * @callback module:@lumjs/core/types~IsaParser
 * @param {object} type - The type value passed to `isa()`
 * @param {mixed} v - The value being tested by `isa()`
 * @this {module:@lumjs/core/types~IsaOptions}
 */

/**
 * A simple custom `isa()` type test supported by the default parser.
 * 
 * @typedef {object} module:@lumjs/core/types~IsaTest
 * @prop {function} is - The test function to run.
 * 
 * Will be passed the value being tested as the only argument.
 * 
 * If this returns a value that evaluates to `true`, then the
 * test has passed, and `isa()` will immediately return `true`.
 * 
 * If this returns a value that evaluates to `false`, then the test
 * has failed, and `isa()` will move onto the next type test,
 * continuing until either one of the tests passes, or all fail.
 *
 */

/**
 * Rule definition `object` supported by the default `isa()` parser.
 * 
 * @typedef {object} module:@lumjs/core/types~IsaRule
 * @prop {module:@lumjs/core/types~IsaRules} isa - The rules to apply.
 */

/**
 * Supported properties for `isa()` Rules.
 * 
 * Any property not _explicitly_ listed in this description will set
 * the {@link module:@lumjs/core/types~IsaOptions option} of that name
 * to the specified value. This can be used to set both default options,
 * or any custom options supported by extra parsers you may add.
 * 
 * @typedef {object} module:@lumjs/core/types~IsaRules
 * 
 * @prop {module:@lumjs/core/types~IsaParser} [parsers] Add a parser.
 * 
 * This rule will append the parser function to the array of `parsers`
 * in the options for the current `isa()` function call.
 * 
 * @prop {module:@lumjs/core/types~IsaRuleTest} [test] A type test function.
 * @prop {module:@lumjs/core/types~IsaRuleProcess} [process] A setup function.
 * 
 * @see {@link module:@lumjs/core/types~IsaRule}
 */

/**
 * An advanced custom `isa()` test declared in a Rule.
 * 
 * @callback module:@lumjs/core/types~IsaRuleTest
 * 
 * @param {mixed} v - The value being tested by `isa()`
 * @param {module:@lumjs/core/types~IsaOptions} opts - `isa()` options
 * @param {object} type - The type value passed to `isa()`
 * @this {module:@lumjs/core/types~IsaRules}
 * @returns {boolean} The return values from this are handled the same way
 * as the `is()` method of {@link module:@lumjs/core/types~IsaTest} objects.
 * 
 */

/**
 * A custom `isa()` Rule setup function.
 * 
 * Can be used to customize the options in ways not normally
 * allowed, or do any other setup logic that is beyond the
 * capabilities of the default options parser.
 * 
 * @callback module:@lumjs/core/types~IsaRuleProcess
 * 
 * @param {module:@lumjs/core/types~IsaOptions} opts - Options
 * @param {mixed} v - The value being tested.
 * @param {object} type - The type value passed to `isa()`.
 * @this {module:@lumjs/core/types~IsaRules}
 * @returns {void}
 */

/**
 * A special class used for testing the contents of containers.
 * 
 * Used by the `is[List|Array|Map]Of()` methods, this class
 * abstracts out most of the common functionality of those tests.
 *
 * @alias module:@lumjs/core/types.OfTest
 * 
 * @prop {boolean} valid - Does `rules.value` pass the validity test?
 * @prop {object}  rules - Rules passed to the constructor.
 * @prop {object}  state - Contains the current state of the tests.
 * @prop {Array}   vtype - Value type tests.
 * @prop {?Array}  ktype - Key/index type tests; `null` if unused.
 * 
 * @prop {mixed} target  - An alias to the `rules.value` property.
 * 
 * @prop {mixed} rules.value - Should be the container we are testing.
 * May be `null` if no valid `rules` were passed.
 * 
 * @prop {boolean} [rules.details=false] Use detailed result objects?
 * 
 * If `true` the `pass` and `fail` dynamic result properties will return
 * {@link module:@lumjs/core/types.OfTestResult} objects. 
 * 
 * If `false` (default), the results will be simple `boolean` values.
 * 
 * @prop {boolean} [rules.empty=false] Are empty containers valid?
 * 
 * Determines the return value of the `empty()` method.
 * 
 * Should be used by the calling test function to determine if the
 * test should return a `pass` or `fail` value on an empty container.
 *
 * @prop {boolean} state.empty - Has the container been marked empty?
 * 
 * @prop {object} state.at - Info about the last value tested.
 * Will be used as the `failed` property in the `OfTestResult` object.
 * 
 * @prop {mixed} state.at.index - Index/Key of the last value tested.
 * 
 * For `isArrayOf()` and `isListOf()` this will always be a `number`.
 * 
 * For `isMapOf()` this will be set to the _key_ of each item in the map,
 * and so may be any type of value. 
 * 
 * This will be set to `-1` if no value has been tested yet,
 * which will always be the case for empty or invalid containers.
 * 
 * @prop {mixed} state.at.value - The last value that was tested.
 * 
 * Will be the `rules.value` itself if no value has been tested yet,
 * which will always be the case for empty or invalid containers.
 * 
 * @prop {boolean} [state.at.key] Was it the key test that failed?
 * Only included if `ktype` is not `null`.
 */
class OfTest
{
  /**
   * Create an `OfTest` instance. 
   * 
   * Unless you are creating a custom test function similar to the built-in
   * `is*Of()` methods you'll never need to create an instance of this.
   * It's documented here for the potential of advanced tests.
   * 
   * @param {function} valid - A validity test for the `rules.value`.
   * 
   * This will be used to set the value of the `this.valid` property.
   * 
   * @param {object} rules - Object to set as the `this.rules` property.
   * 
   * If `valid(rules)` returns `true` then the `rules` will be 
   * changed to `{value: rules}`. This is a short-cut so that
   * the containers can be passed directly if default rules are okay.
   * 
   * If this is NOT an object, then the `rules` will be changed to
   * `{value: null}`, which should ensure that `this.valid` is `false`.
   * 
   * See the class property description for the supported optional values.
   * 
   * @param {object} rules.value - The container being tested.
   * 
   * @param {?Array} valueTypes - An array of type tests for the values.
   * 
   * Will be set as the `this.vtype` property.
   *
   * If `null` (only applicable if `keyTypes` is NOT `null`), then the
   * value type tests will be skipped.
   * 
   * See {@link module:@lumjs/core/types.isa} for details on the tests.
   * 
   * @param {?Array} [keyTypes=null] Array of type tests for the _key/index_.
   * 
   * Will be set as the `this.ktype` property.
   * 
   * Uses `isa()` just like `valueTypes`. Is only needed in very specific
   * cases, such as `isMapOf()` as `Map` objects may have any kind of key.
   * If `null` (default), no tests against the keys will be done.
   * 
   * @throws {TypeError} If any of the parameters is not valid.
   * @throws {RangeError} If both `valueTypes` and `keyTypes` are `null`.
   * 
   */
  constructor(valid, rules, valueTypes, keyTypes=null)
  {
    if (typeof valid !== F)
    {
      throw new TypeError("Invalid OfTest validator");
    }

    if (valueTypes !== null && !isArray(valueTypes))
    {
      throw new TypeError("Invalid valueTypes array");
    }

    if (keyTypes !== null && !isArray(keyTypes))
    {
      throw new TypeError("Invalid keyTypes array");
    }

    if (valueTypes === null && keyTypes === null)
    {
      throw new RangeError("Both valueTypes and keyTypes are null");
    }

    if (valid(rules))
    { // The container was sent instead of rules.
      rules = {value: rules};
      this.valid = true;
    }
    else if (isObj(rules))
    {
      this.valid = valid(rules.value);
    }
    else
    { // That's gonna be a no from me.
      rules = {value: null};
      this.valid = false;
    }

    this.vtype = valueTypes;
    this.ktype = keyTypes;
    this.rules = rules;
    this.state =
    {
      empty: false,
      at:
      {
        index: -1,
        value: rules.value,
      },
    }

    if (keyTypes !== null)
    {
      this.state.at.key = false;
    }

    // A shortcut for tests.
    this.target = rules.value;

  } // constructor()

  /**
   * Run `isa()` tests on the next item.
   * 
   * @param {*} key - `state.at.index` will be set to this
   * 
   * If `this.ktype` was set (via the `keyTypes` constructor argument),
   * then the `key` will be tested for validity against those tests using
   * the `isa()` function.
   * 
   * @param {*} val - `state.at.value` will be set to this
   * 
   * The `val` will be tested for validity against the `this.vtype` tests
   * (via the `valueTests` constructor argument) using the `isa()` function.
   * 
   * @returns {boolean} Was the `val` (and the `key` if applicable) valid?
   */
  test(key, val)
  {
    this.state.at.index = key;
    this.state.at.value = val;

    if (this.ktype)
    {
      const keyOk = isa(key, ...this.ktype);
      if (!keyOk)
      {
        this.state.at.key = true;
        return false;
      }
    }

    return isa(val, ...this.vtype);
  }

  /**
   * Mark `this.state.empty` as `true`
   * 
   * @returns {boolean} `this.rules.empty`;
   * determines if the test should be considered a `pass` or `fail`
   * upon being marked `empty`.
   */
  empty()
  {
    this.state.empty = true;
    return !!this.rules.empty;
  }

  /**
   * A dynamic getter property that returns a _passed_ test result.
   * @returns {(object|boolean)} Depends on `this.rules.details` value.
   */
  get pass()
  {
    if (this.rules.details)
    {
      const empty = this.state.empty;
      return {pass: true, empty};
    }

    return true;
  }

  /**
   * A dynamic getter property that returns a _failed_ test result.
   * @returns {(object|boolean)} Depends on `this.rules.details` value.
   */
  get fail()
  {
    if (this.rules.details)
    {
      const {empty, at: failed} = this.state;
      return {pass: false, empty, failed};
    }

    return false;
  }

}

exports.OfTest = OfTest;

/**
 * Extended return value from any test powered by the `OfTest` class.
 * 
 * Used if `rules.details` was set to `true`.
 * 
 * @typedef module:@lumjs/core/types.OfTestResult
 * 
 * @prop {boolean} pass  - Did the test pass?
 * @prop {boolean} empty - Was the list empty?
 * 
 * @prop {object} [failed] Failure information;
 * Only addedd if `pass` is `false`.
 * 
 * Will be the {@link module:@lumjs/core/types.OfTest.state.at}
 * property from the underlying `OfTest` instance.
 * See the documentation for that property for further details.
 * 
 */

/**
 * A nested class representing an explicit set of rules for `OfTest`.
 * 
 * Not really needed for anything except for `isPlainObjectOf()` function.
 * 
 * @alias module:@lumjs/core/types.OfTest.Rules
 */
class OfTestRules
{
  /**
   * Define the Rules
   * 
   * @param {mixed} value - Sets `rules.value`
   * @param {object} [opts] Optional rules
   * @param {boolean} [opts.empty=false] Sets `rules.empty`
   * @param {boolean} [opts.details=false] Sets `rules.details`
   *  
   */
  constructor(value, opts)
  {
    this.value   = value;
    this.empty   = opts.empty   ?? false;
    this.details = opts.details ?? false;
  }
}

def(OfTest, 'Rules', OfTestRules);

/**
 * See if every item in an `Array` passes an `isa()` test.
 * 
 * Uses the {@link module:@lumjs/core/types.OfTest} class.
 * This implementation works explicitly with `Array` objects only.
 * 
 * @param {(object|Array)} rules - Rules for this test function.
 * 
 * If this argument is an `Array` it is assumed to be the
 * `rules.value` named option.
 * 
 * @param {Array} rules.value - The actual Array object to test.
 * 
 * @param  {...any} types - See {@link module:@lumjs/core/types.isa}.
 * 
 * All arguments other than `rules` are passed to `isa()` with each item
 * from the `rules.value` object as the subject of the test.
 * 
 * @returns {(boolean|object)} Results of the test.
 * 
 * If `rules.details` was `true` this will be a
 * {@link module:@lumjs/core/types~OfTestResult} object.
 *
 * Otherwise it will be a simple `boolean` value indicating
 * if the test passed or failed.
 * 
 * @alias module:@lumjs/core/types.isArrayOf
 */
function isArrayOf(rules, ...types)
{
  // Build an OfTest instance.
  const test = new OfTest(isArray, rules, types);

  if (!test.valid) 
  { // Test was invalid right off the bat.
    return test.fail;
  }

  const target = test.target;

  if (target.length === 0)
  { // Array is empty.
    if (!test.empty())
    { // `opts.empty` was not `true`
      return test.fail;
    }
  }
  else
  { // Run the tests on each item.
    for (let i=0; i < target.length; i++)
    {
      if (!test.test(i, target[i]))
      { // The test failed.
        return test.fail;
      }
    }
  }

  // If we made it here, we passed.
  return test.pass;
}

exports.isArrayOf = isArrayOf;

/**
 * See if every item in an Iterable list passes an `isa()` test.
 * 
 * Uses the {@link module:@lumjs/core/types.OfTest} class.
 * This implementation works with any kind of `Iterable` object.
 * 
 * @param {(object|Iterable)} rules - Rules for this test function.
 * 
 * If this argument is an `Iterable` object it is assumed to be the
 * `rules.value` named option.
 * 
 * @param {Iterable} rules.value - The actual list object for the tests.
 * 
 * @param  {...any} types - See {@link module:@lumjs/core/types.isa}.
 * 
 * All arguments other than `rules` are passed to `isa()` with each item
 * from the `rules.value` object as the subject of the test.
 * 
 * @returns {(boolean|object)} Results of the test.
 * 
 * If `rules.details` was `true` this will be a
 * {@link module:@lumjs/core/types~OfTestResult} object.
 *
 * Otherwise it will be a simple `boolean` value indicating
 * if the test passed or failed.
 * 
 * @alias module:@lumjs/core/types.isListOf
 */
function isListOf(rules, ...types)
{
  // Build an OfTest instance.
  const test = new OfTest(isIterable, rules, types);

  if (!test.valid) 
  { // Test was invalid right off the bat.
    return test.fail;
  }

  let i = 0;
  for (const val of test.target)
  {
    if (!test.test(i++, val))
    { // The test failed.
      return test.fail;
    }
  }

  if (i === 0)
  { // List was empty.
    if (!test.empty())
    { // `opts.empty` was not `true`
      return test.fail;
    }
  }

  // If we made it here, we passed.
  return test.pass;
}

exports.isListOf = isListOf;

const isMap = v => (v instanceof Map);

/**
 * See if every key/value pair in a Map passes an `isa()` test.
 * 
 * Uses the {@link module:@lumjs/core/types.OfTest} class.
 * This implementation works with only `Map` objects.
 * 
 * Unlike `isArrayOf()` and `isListOf()`, this function does not
 * have a variable argument list. It has only **3** arguments,
 * and all of them are mandatory!
 * 
 * @param {(object|Map)} rules - Rules for this test function.
 * 
 * If this argument is a `Map` object it is assumed to be the
 * `rules.value` named option.
 * 
 * @param {Map} rules.value - The actual list object for the tests.
 * 
 * @param  {?Array} keyTypes - Types the _keys_ must be one of.
 * 
 * If anything other than an `Array` or `null` is passed here, 
 * it will be wrapped in an `Array`.
 * 
 * @param {?Array} valTypes - Types the _values_ must be one of.
 * 
 * If anything other than an `Array` or `null` is passed here, 
 * it will be wrapped in an `Array`.
 * 
 * @returns {(boolean|object)} Results of the test.
 * 
 * If `rules.details` was `true` this will be a
 * {@link module:@lumjs/core/types~OfTestResult} object.
 *
 * Otherwise it will be a simple `boolean` value indicating
 * if the test passed or failed.
 * 
 * @alias module:@lumjs/core/types.isListOf
 */
function isMapOf(rules, keyTypes, valTypes)
{
  if (notNil(keyTypes) && !isArray(keyTypes))
  {
    keyTypes = [keyTypes];
  }

  if (notNil(valTypes) && !isArray(valTypes))
  {
    valTypes = [valTypes];
  }

  const test = new OfTest(isMap, rules, valTypes, keyTypes);

  if (!test.valid) 
  { // Test was invalid right off the bat.
    return test.fail;
  }

  if (test.target.size === 0)
  { // Map is empty.
    if (!test.empty())
    { // `opts.empty` was not `true`
      return test.fail;
    }
  }
  else
  {
    for (const [key,val] of test.target)
    {
      if (!test.test(key,val))
      {
        return test.fail;
      }
    }
  }

  // We made it, yay!
  return test.pass;
}

exports.isMapOf = isMapOf;

const isntRules = v => (isObj(v) && !(v instanceof OfTestRules));

/**
 * See if all enumerable property values in an `object` pass an `isa()` test.
 * 
 * Uses the {@link module:@lumjs/core/types.OfTest} class.
 * This implementation works with any _plain_ objects.
 * 
 * There is a special function called `rules(value, opts)` defined on this
 * test function that will return an instance of the `OfTest.Rules` class,
 * passing all parameters along to the constructor.
 * 
 * @param {object} rules - Rules for this test function.
 * 
 * If this argument is anything other than a `OfTest.Rules` instance,
 * it is assumed to be the `rules.value` named option.
 * 
 * If you want to set any of the optional rules, you can use the `rules()`
 * helper function mentioned above to return a `OfTest.Rules` instance:
 * 
 * ```js
 * const opts = {details: true, empty: true}; // Example rules.
 * const isValid = isObjOf(isObjOf.rules(value, opts), type1, type2, ...);
 * ```
 * 
 * @param {Iterable} rules.value - The actual list object for the tests.
 * 
 * @param  {...any} types - See {@link module:@lumjs/core/types.isa}.
 * 
 * All arguments other than `rules` are passed to `isa()` with each item
 * from the `rules.value` object as the subject of the test.
 * 
 * @returns {(boolean|object)} Results of the test.
 * 
 * If `rules.details` was `true` this will be a
 * {@link module:@lumjs/core/types~OfTestResult} object.
 *
 * Otherwise it will be a simple `boolean` value indicating
 * if the test passed or failed.
 * 
 * @alias module:@lumjs/core/types.isObjOf
 */
function isPlainObjectOf(rules, ...types)
{
  // Build an OfTest instance.
  const test = new OfTest(isntRules, rules, types);

  if (!test.valid) 
  { // Test was invalid right off the bat.
    return test.fail;
  }

  const target = test.target;
  const keys = Object.keys(target);

  if (keys.length === 0)
  { // Object had no enumerable properties.
    if (!test.empty())
    { // `opts.empty` was not `true`
      return test.fail;
    }
  }
  else
  { // There are properties to check.
    for (const key of keys)
    {
      if (!test.test(key, target[key]))
      { // The test failed.
        return test.fail;
      }
    }
  }

  // If we made it here, we passed.
  return test.pass;
}

def(isPlainObjectOf, 'rules', function()
{
  return new OfTestRules(...arguments);
});

exports.isObjOf = isPlainObjectOf;

// Just in case let's load this down here.
const {deprecated} = require('../meta');
