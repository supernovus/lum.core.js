const def = require('./def');
const {S,F} = require('./js');
const {COMPLEX} = require('./typelist');
const {needType,needObj} = require('./needs');
const {doesDescriptor} = require('./basics');

function lazy(target, name, initfunc, opts={})
{
  needType(COMPLEX, target, 'obj must be an object');
  needType(S, name, 'name must be a string');
  needType(F, initfunc, 'initfunc must be a function');
  needObj(opts, 'opts parameter was not an object');

  // The `this` object for the functions.
  const context = 
  { 
    name, 
    target, 
    opts, 
    arguments,
    assign: opts.assign,
    def: opts.def,
  }

  // The descriptor for the lazy accessor.
  const desc = 
  {
    configurable: true, 
    enumerable: opts.enumerable ?? false,
  };

  // Replace the property if rules are correct.
  const defval = function(value)
  {
    const assign = (context.assign ?? value !== undefined);
    if (assign)
    { // Replace the lazy accessor with the returned value.
      def(target, name, value, context.def);
      // Now return the newly assigned value.
      return target[name];
    }
    else if (doesDescriptor(value))
    { // A descriptor was returned, extract the real value.
      if (typeof value.get === F)
      {
        return value.get();
      }
      else 
      {
        return value.value;
      }
    }
    else 
    { // Just return the original value.
      return value;
    }
  }

  desc.get = function()
  { 
    return defval(initfunc.call(context,context));
  }

  if (typeof opts.set === F)
  { // We want to assign a lazy setter as well.
    desc.set = function(value)
    {
      defval(opts.set.call(context, value));
    }
  }

  // Assign the lazy accessor property.
  return def(target, name, desc);
}

// Gotta be one of the greatest lines...
def(def, 'lazy', lazy);

// And this is a close second...
def(lazy, 'def', def);

module.exports = lazy;
