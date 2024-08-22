"use strict";

const {isObj} = require('../types/basics');

/**
 * A helper function to support both positional arguments 
 * and named options in the same method signature.
 *
 * @param {object} opts - Options built from positional arguments
 * 
 * Keep in mind that this object **WILL** be modified!
 * 
 * @param {string} optArg - The option that may contain named options
 * 
 * Generally the name of the first positional argument that may be
 * an `object` full of options or a different positional argument value.
 * 
 * The biggest limitation is that it cannot be an `object` value when used
 * as a positional argument, as that will always be seen as the _options_.
 * 
 * @param {*} optDef - A default value for `opts[optArg]`
 * 
 * If `opts[optArg]` was an `object`, we'll compose its properties
 * into `opts` directly. If after that `opts[optArg]` is still the
 * options `object` then this value will be used instead.
 * 
 * @param {boolean} [validate=true] Ensure `opts` is an object?
 * 
 * Should only be disabled if you know for certain it is.
 * 
 * @example <caption>Example usage</caption>
 * 
 *   function example(first=true, second=null, third="test")
 *   {
 *     const opts = argOpts({first, second, third}, 'first', true);
 *   }
 * 
 * @exports module:@lumjs/core/opt/args
 */
function argOpts(opts, optArg, optDef, validate=true)
{
  if (validate && !isObj(opts)) 
  {
    throw new TypeError("Invalid opts object");
  }

  if (isObj(opts[optArg]))
  { // Merge the named options.
    const specOpts = opts[optArg];
    Object.assign(opts, specOpts);
    if (opts[optArg] === specOpts)
    { // specOpts didn't override the real option.
      opts[optArg] = optDef;
    }
  }

} // argOpts()

module.exports = argOpts;
