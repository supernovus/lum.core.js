
const {S,def,notNil,isObj} = require('./types')
const {InternalObjectId} = require('./objectid');

const ENUM_ID = new InternalObjectId({name: '$Enum'});

/**
 * A function to build magic Enum objects.
 * 
 * Like the built-in `Symbol`, this is called as a function, not a constructor.
 * 
 * @param {*} spec - TBD
 * @param {*} [opts] - TBD
 * @returns {object} A magic Enum object.
 */
function Enum (spec, opts={})
{
  if (!isObj(spec))
  {
    throw new TypeError("Enum spec must be an object");
  }
  if (!isObj(opts))
  {
    throw new TypeError("Enum options must be an object")
  }

  const anEnum = ENUM_ID.tag({});

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
    const desc = {configurable: true, enumerable: true};
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
        throw new TypeError("Non-string passed in Lum.Enum object");
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
  { // Use lock.
    let lockOpts;
    if (Array.isArray(opts.lock))
    {
      lockOpts = opts.lock;
    }
    else if (isObj(opts.lock))
    {
      lockOpts = [true, opts.lock, false];
    }
    else if (typeof opts.lock === B)
    {
      lockOpts = [opts.lock, null, false];
    }
    else 
    {
      lockOpts = [true, null, false];
    }
    return lock(anEnum);
  }
  else if (!opts.open) 
  { // Use Object.freeze()
    return Object.freeze(anEnum);
  }

  return anEnum;

} // Enum

// Add an 'is' method.
def(Enum, 'is', ENUM_ID.isFunction());

module.exports = Enum;
