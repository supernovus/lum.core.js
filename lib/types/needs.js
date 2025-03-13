const {F, S, B} = require('./js');
const {isType, isa} = require('./isa');
const {isObj, isComplex} = require('./basics');

// Internal function used by both needObj and needType
function needOpts(opts, fn, bopt, ons)
{
  if (isObj(opts))
  {
    if (opts.log)
    { // Make a closure to handle the logging
      const info = (opts.log === true) ? [opts] 
        : (Array.isArray(opts.log) ? opts.log : [opts.log]);
      opts.$log = () => console.error(...info);
    }
  }
  else if (typeof opts === S)
  { // A message was passed.
    opts = 
    {
      msg: opts,
    }
    if (ons) ons(opts);
  }
  else if (typeof opts === B)
  {
    opts = {[bopt]: opts}
  }
  else
  {
    console.error('invalid options', {fn, opts});
    opts = {};
  }
  return opts;
}

exports._needOptions = needOpts;

/**
 * If a value is not an object, throw an error.
 * 
 * @param {*} v - The value we're testing.
 * 
 * @param {(object|boolean|string)} [opts] Options
 * 
 * - If this is a string, it will be used as `opts.msg`,
 *   and `opts.fun` will be determined by the presence
 *   of the word 'function' (case-insensitive) in the message.
 * - If this is a boolean, it will be used as `opts.fun`,
 *   and the default message will be used.
 * 
 * @param {boolean} [opts.fun=false] Also accept `function`?
 * 
 * By default this function uses `isObj()` to perform the
 * test. If `opts.fun` is `true` then it'll use `isComplex()` instead.
 * 
 * @param {(object|string|true)} [opts.log] Optional debugging information.
 * 
 * This is a way to specify arguments to be sent to the
 * console.error() method before the TypeError is thrown.
 * 
 * If this is an `Array` object, it will be used as positional arguments.
 * 
 * If it is boolean `true`, the `opts` object itself will be used.
 * 
 * Any other value will be used as the sole argument.
 * 
 * @param {string} [opts.msg] The error message to use on failure.
 * 
 * If not specified, a simple default message will be used.
 * 
 * @param {?string} [msg=null] A positional version of `opts.msg`.
 * 
 * Setting `opts.msg` as a named option will take precedence 
 * over this positional argument.
 * 
 * @throws {TypeError} If the type check failed.
 * @alias module:@lumjs/core/types.needObj
 */
function needObj (v, opts={}, msg=null)
{
  opts = needOpts(opts, 'needObj', 'fun', 
    (o) => o.fun = o.msg.toLowerCase().includes(F));

  const ok = opts.fun ? isComplex(v) : isObj(v);

  if (!ok)
  { // Did not pass the test.
    if (typeof opts.msg === S)
    {
      msg = opts.msg;
    }
    else if (typeof msg !== S)
    { // Use a default message.
      msg = "Invalid object";
      if (opts.fun)
        msg += " or function";
    }

    if (opts.$log) opts.$log();

    throw new TypeError(msg);
  }
}

exports.needObj = needObj;

/**
 * If a value is not a certain type, throw an error.
 * 
 * @param {string} type - The type name as per `isType()`.
 * @param {*} v - The value we're testing.
 * 
 * @param {(object|string)} [opts] Options
 * 
 * If this is a string, it will be used as `opts.msg`.
 * 
 * @param {string} [opts.msg] See needObj() for details.
 * @param {(object|string|true)} [opts.log] See needObj() for details.
 * 
 * @param {?string} [msg=null] A positional version of `opts.msg`;
 * handled the same was as needObj().
 * 
 * @throws {TypeError} If the type check failed.
 * @alias module:@lumjs/core/types.needType
 */
function needType (type, v, opts={}, msg=null)
{
  opts = needOpts(opts, 'needType', 'null');

  if (typeof opts.null === B)
  {
    console.warn("needType(): 'allowNull' is no longer supported");
  }

  if (!isType(type, v))
  {
    if (typeof opts.msg === S)
    {
      msg = opts.msg;
    }
    else if (typeof msg !== S)
    { // Use a default message.
      msg = `Invalid ${type} value`;
    }

    if (opts.$log) opts.$log();

    throw new TypeError(msg);
  }
}

exports.needType = needType;
 
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
    console.error("needs()", v, types);
    throw error;
  }
}

exports.needs = needs;
