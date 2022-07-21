const {F, S, B} = require('./js');
const {isType, isa} = require('./isa');
const {isObj, isComplex} = require('./basics');

/**
 * If a value is not an object, throw an error.
 * 
 * @param {*} v - The value we're testing.
 * @param {boolean} [allowFunc=false] - Also accept functions?
 * @param {string} [msg] A custom error message.
 * @throws {TypeError} If the type check failed.
 * @alias module:@lumjs/core/types.needObj
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

exports.needObj = needObj;

/**
 * If a value is not a certain type, throw an error.
 * 
 * @param {string} type - The type name as per `isType()`.
 * @param {*} v - The value we're testing.
 * @param {string} [msg] A custom error message.
 * @throws {TypeError} If the type check failed.
 * @alias module:@lumjs/core/types.needType
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

exports.needType = needType;

// Options parser for needs();
const NEEDS_PARSER = function(type, v)
{ // `this` is the options object itself.
  if (typeof type.is === F)
  { // We assume `is()` methods are the type check.
    if (type.is(v)) return true;
  }
}
 
/**
* A wrapper around `isa()` that will throw an error on failure.
* 
* @param {*} v - The value we're testing.
* @param {...any} types - The types the value should be one of.
* 
* In addition to the `types` supported by `isa()` this will also
* look for an `object` with a single property named `error`
* which can be either a `string` or any subclass of `Error`.
* If specified, it will override the error message that will be thrown.
*
* @throws {TypeError} If the type check failed.
* @throws {Error} If a custom error was specified.
* @alias module:@lumjs/core/types.needs
*/
function needs(v, ...types)
{
  let error;

  function parser(type, v)
  {
    // Only process objects with a single `error` property.
    if ('error' in type && Object.keys(type).length === 1)
    {
      if (typeof type.error === 'string')
      { // An error message.
        error = new TypeError(type.error);
      }
      else if (type.error instanceof Error)
      { // An error object.
        error = type.error;
      }
    }
  }

  if (!isa(v, {isa:{parsers: parser}}, ...types))
  {
    if (!(error instanceof Error))
    {
      error = new TypeError("value did not pass needs check");
    }
    throw error;
  }
}

exports.needs = needs;
