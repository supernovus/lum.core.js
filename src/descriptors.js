
const {InternalObjectId} = require('./objectid');
const Enum = require('./enum');
const {doesDescriptor,isObj,isComplex,def,B,F,N} = require('./types');

  /**
   * Get a property descriptor.
   * 
   * This is like `Object.getOwnPropertyDescriptor`, except that method
   * fails if the property is inhereted. This method will travel through
   * the entire prototype chain until it finds the descriptor.
   * 
   * @param {object|function} obj - Object to find a property in.
   * @param {string} prop - Name of the property we want the descriptor of.
   * @param {mixed} [defval] The fallback value if no descriptor is found.  
   * 
   * @returns {mixed} - The descriptor if found, `defval` if not.
   */
function getProperty(obj, prop, defval)
{
  if (!isComplex(obj)) throw new TypeError("Target must be an object or function");
  // Yeah it looks like an infinite loop, but it's not.
  while (true)
  {
    const desc = Object.getOwnPropertyDescriptor(obj, prop);
    if (isObj(desc))
    { // Found it.
      return desc;
    }

    // Didn't find it, so let's try the next object in the prototype chain.
    obj = Object.getPrototypeOf(obj);
    if (!isComplex(obj))
    { // We've gone as far up the prototype chain as we can, bye now!
      return defval;
    }
  }
}

exports.getProperty = getProperty;

const DESC_ID = new InternalObjectId({name: '$LumDescriptor'});
const DESC_ADD = Enum(['ONE','SHORT', 'SET'], {flags: true});

/**
 * Create a magic Descriptor object.
 * @param {object} desc - Descriptor template.
 * @param {object} [opts] - Options (to be documented.)
 * @returns {object} `desc`
 */
function descriptor(desc, opts={})
{
  if (!isObj(opts)) throw new TypeError("Options must be an object");

  if (typeof desc === B)
  { // This is a special case.
    opts.accessorSafe = desc;
    opts.add = DESC_ADD.ONE;
    desc = {};
  }

  if (!isObj(desc)) 
    throw new TypeError("First parameter (desc) must be a descriptor template object");

  if (!Object.isExtensible(desc))
    throw new RangeError("First parameter (desc) must not be locked, sealed, frozen, etc.");

  const accessorSafe = (typeof opts.accessorSafe === B) 
    ? opts.accessorSafe
    : (desc.writable === undefined);
  
  DESC_ID.tag(desc);

  // Add a function or other property.
  const add = def(desc);

  // Add a getter.
  function accessor(name, getter, setter)
  {
    const adef = {configurable: true};
    if (typeof getter === F) adef.get = getter;
    if (typeof setter === F) adef.set = setter;
    def(desc, name, adef);
  }

  add('accessorSafe', accessorSafe);

  add('whenDone', function(func)
  {
    if (typeof func === F)
    {
      add('done', func);
    }
    return this;
  });

  if (typeof opts.done === F)
  {
    desc.whenDone(opts.done);
  }

  add('setValue', function (val, noClean)
  {
    if (this.get !== undefined || this.set !== undefined)
    {
      console.error("Accessor properties already defined", this);
    }
    else
    {
      this.value = val;
    }
    
    return this;
  });

  if (accessorSafe)
  {
    function validate ()
    {
      if (this.value !== undefined)
      { 
        console.error("Data 'value' property defined", this);
        return false;
      }

      for (const arg of arguments)
      { // All accessor arguments must be functions.
        if (typeof arg !== F) throw new TypeError("Parameter must be a function");
      }

      return true;
    }

    add('setGetter', function(func)
    {
      if (validate.call(this, func))
        this.get = func;
      return this;
    });

    add('setSetter', function(func)
    {
      if (validate.call(this, func))
        this.set = func;
      return this;    
    });

    add('setAccessor', function(getter, setter)
    {
      if (validate.call(this, getter, setter))
      {
        this.get = getter;
        this.set = setter;
      }
      return this;
    });

  } // accessorSafe

  if (opts.add)
  {
    const addTypes 
      = (typeof opts.add === N) 
      ? opts.add 
      : DESC_ADD.SET;

    function addBool(propname)
    {
      const setBool = function() 
      { 
        this[propname] = true; 
        return this; 
      }

      if (addTypes & DESC_ADD.ONE)
      {
        const aname = propname[0];
        accessor(aname, setBool);
      }
      if (addTypes & DESC_ADD.SHORT)
      {
        const aname = propname.substring(0,4);
        accessor(aname, setBool);
      }
      if (addTypes & DESC_ADD.SET)
      {
        const aname = 'set'+ucfirst(propname);
        accessor(aname, setBool);
      }
    }

    addBool('configurable');
    addBool('enumerable');
    addBool('writable');

  } // addBools

  // Is the descriptor ready to be used?
  accessor('isReady', function()
  {
    return doesDescriptor(this);
  });

  return desc;
} // descriptor()

exports.descriptor = descriptor;

/**
 * Get a Descriptor object.
 * @param {object} desc - Either a Descriptor, or a descriptor template. 
 * @returns {object}
 */
function getDescriptor(desc)
{
  return DESC_ID.is(desc) ? desc : descriptor(desc);
}

exports.getDescriptor = getDescriptor;

/**
 * A factory for building magic Descriptor objects.
 */
const DESC =
{
  get RO()    { return descriptor(true)  },
  get CONF()  { return descriptor(true).c  },
  get ENUM()  { return descriptor(true).e  },
  get WRITE() { return descriptor(false).w },
  get RW()    { return descriptor(false).c.w },
  get DEF()   { return descriptor(true).c.e  },
  get OPEN()  { return descriptor(false).c.e.w },
}

def(DESC)
  ('make', descriptor)
  ('is',   DESC_ID.isFunction())
  ('get',  getDescriptor)
  ('does', doesDescriptor)
  ('ADD',  DESC_ADD);

exports.DESC = DESC;

