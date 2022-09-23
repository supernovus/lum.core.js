const {S,def,notNil,isObj,needObj,TYPES} = require('./types');
const {InternalObjectId} = require('./objectid');

// Internal id instances should never be exported.
const ENUM_ID = new InternalObjectId({name: '$Enum'});

/**
 * A function to build magic Enum objects.
 * 
 * Like the built-in `Symbol`, this is called as a function, not a constructor.
 * 
 * @param {*} spec - TBD
 * @param {*} [opts] - TBD
 * @returns {object} A magic Enum object.
 * @exports module:@lumjs/core/enum
 */
function Enum (spec, opts={})
{
  needObj(spec, "Enum spec must be an object")
  needObj(opts, "Enum options must be an object")

  const anEnum = ENUM_ID.tag({});

  const configurable = opts.configurable ?? false;
  const enumerable   = opts.enumerable   ?? true;

  function getVal (name, def)
  {
    if (opts.symbols)
    { // We want to use symbols.
      if (opts.globals)
      {
        return Symbol.for(name);
      }
      else
      {
        return Symbol(name);
      }
    }
    else
    { // Use the default.
      return def;
    }
  }

  function addVal(pName, sName, inVal)
  {
    const desc = {configurable, enumerable};
    desc.value = getVal(sName, inVal);
    def(anEnum, pName, desc);
  }

  if (Array.isArray(spec))
  { // An array of strings is expected.
    let counter = opts.counter ?? 1;

    for (let i = 0; i < spec.length; i++)
    {
      const name = spec[i];
      if (typeof name !== S)
      {
        throw new TypeError("Non-string passed in Enum object");
      }

      const val 
        = opts.strings 
        ? name 
        : (opts.flags ? counter : i);

      addVal(name, name, val);

      if (opts.flags)
      { // Increment the binary flag counter.
        counter *= 2;
      }
    }
  }
  else
  { // An object mapping of property name to value.
    for (const pName in spec)
    {
      const val = spec[pName];
      const sName = (typeof val === S) ? val : pName;
      addVal(pName, sName, val);
    }
  }

  if (notNil(opts.lock))
  { // Use lock() function.
    let lockOpts;
    if (Array.isArray(opts.lock))
    { // Specified the lock parameters as an array.
      lockOpts = opts.lock;
    }
    else if (isObj(opts.lock))
    { // An object is assumed to be the `cloneOpts` parameter.
      lockOpts = [true, opts.lock, false];
    }
    else if (typeof opts.lock === B)
    { // Boolean is assumed to be the `cloneable` parameter.
      lockOpts = [opts.lock, null, false];
    }
    else 
    { // Anything else we use default values.
      lockOpts = [];
    }
    return lock(anEnum, ...lockOpts);
  }
  else if (!opts.open) 
  { // Use Object.freeze()
    return Object.freeze(anEnum);
  }

  return anEnum;

} // Enum

/**
 * Is a value an *Enum* magic object?
 * @function module:@lumjs/core/enum.is
 * @param {*} obj - The expected object/function to test.
 * @returns {boolean}
 */
const isEnum = ENUM_ID.isFunction()
def(Enum, 'is', isEnum);

/**
 * Is a value an *Enum* magic object?
 * @name module:@lumjs/core/types.isEnum
 * @function
 * @param {*} v - The value to test.
 * @returns {boolean}
 * @see module:@lumjs/core/enum.is
 */

/**
 * Extension type for {@link module:@lumjs/core/enum} magic objeccts.
 * @memberof module:@lumjs/core/types.TYPES
 * @member {string} ENUM - Is an Enum object?
 */
TYPES.add('ENUM', 'enum', isEnum, 'isEnum');

module.exports = Enum;

// Loading this at the end.
const {lock} = require('./obj/lock');
