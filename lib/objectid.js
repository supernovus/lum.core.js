
const {notNil,def,isNil,F,N,S,SY} = require('./types');

/**
 * Generate a large random number.
 * 
 * @param {number} [seed] A base number to use.
 * 
 * The default is to use `Date.now()` as the `seed`.
 * 
 * @returns {number}
 * @alias module:@lumjs/core.randomNumber
 */
function randomNumber(seed)
{
  if (typeof seed !== N) seed = Date.now();
  return Math.floor(Math.random() * seed);
}

exports.randomNumber = randomNumber;

const validBase = base => (typeof base === N && base > 1 && base < 37);

class UniqueObjectIds
{
  constructor(opts={})
  {
    def(this, '$options', {value: opts});

    if (validBase(opts.random))
    { // Use random ids.
      def(this, '$randIds', {value: {}});
    }
    else if (validBase(opts.timestamp))
    { // Use timestamp-based ids.
      def(this, '$timeIds', {value: {}});
    }
    else
    { // Use incremental ids.
      def(this, '$incIds',  {value: {}});
    }
    
    const propType = (typeof opts.idProperty);
    const hasProp  = (propType === S || propType === SY);
    const useRegistry = opts.useRegistry ?? !hasProp;

    if (useRegistry)
    { // Using an internal registry.
      def(this, '$registry', {value: new Map()});
    }
    else if (!hasProp)
    { // At least ONE of them MUST be used!
      throw new RangeError("Need one of 'useRegistry' or 'idProperty'");
    }

    if (hasProp)
    { // Add a direct reference to the id property key.
      def(this, '$idProp', {value: opts.idProperty});
    }

  }

  id(obj)
  {
    const hasRegistry = (this.$registry instanceof Map);
    if (hasRegistry && this.$registry.has(obj))
    { // The object was found in the registry.
      return this.$registry.get(obj);
    }

    const idProp = this.$idProp;

    if (idProp && obj[idProp])
    { // An existing object id was found in the object's id property.
      return obj[idProp];
    }

    let cno = this.$options.className ?? {};
    if (typeof cno === F)  cno = {setup: cno};
    else if (cno === 'lc') cno = {lowercase: true};
    else if (cno === 'uc') cno = {uppercase: true};

    let id = '', idNum = null;

    if (typeof this.$options.prefix === S)
    {
      id += this.$options.prefix; 
    }

    let className = obj.constructor.name;

    if (typeof cno.setup === F)
    { // Perform a transformation before any other changes.
      className = cno.setup(className);
    }

    if (cno.lowercase)
    { // Force to lowercase.
      className = className.toLowerCase();
    }
    else if (cno.uppercase)
    { // Force to uppercase.
      className = className.toUpperCase();
    }

    id += className;

    if (this.$incIds)
    { // Auto-incrementing ids.
      const ids = this.$incIds;
      if (ids[className])
      { // An existing value was found.
        idNum = (++ids[className]).toString();
      }
      else
      { // No existing values yet.
        const start = this.$options.startAt ?? 1;
        ids[className] = start;
        if (!this.$options.skipFirst)
        {
          idNum = start;
        }
      }
    }
    else
    { // Something other than auto-increment.
      let ids, radix;
      if (this.$randIds)
      { // Using a random id.
        ids = this.$randIds;
        radix = this.$options.random;
      }
      else if (this.$timeIds)
      { // Using timestamp ids.
        ids = this.$timeIds;
        radix = this.$options.timestamp;
      }
      else
      { // Something went horribly wrong.
        throw new Error("No id storage vars found");
      }

      const getId = () => (this.$randIds 
        ? randomNumber() 
        : Date.now())
        .toString(radix);

      if (ids[className])
      { // Existing ids for this className have been set.
        while (!idNum)
        {
          idNum = getId();
          if (ids[className][idNum])
          { // That id has already been used.
            idNum = null;
          }
          else
          { // Hasn't been used yet, yay!
            ids[className][idNum] = true;
          }
        }
      }
      else
      {
        idNum = getId();
        ids[className] = {};
        ids[className][idNum] = true;
      }
    }

    if (typeof idNum === S)
    {
      if (typeof this.$options.infix  === S)
      {
        id += this.$options.infix;
      }
      id += idNum;
    }

    if (idProp)
    {
      def(obj, idProp, {value: id});
    }

    if (hasRegistry)
    {
      this.$registry.set(obj, id);
    }

    return id;
  } // id()
} // UniqueObjectIds class

exports.UniqueObjectIds = UniqueObjectIds;

/**
 * A class for creating unique identifier objects.
 * Generally only used by my own inernal libraries, thus the name.
 * @alias module:@lumjs/core.InternalObjectId
 */
class InternalObjectId
{
  /**
   * Build a unique InternalObjectId instance.
   * 
   * @param {object} opts - Named options to change default behaviours.
   * @param {string} [opts.name] A friendly name for diagnostics.
   * @param {(string|number)} [opts.id] An internal id value.
   *   Default value is a large random number. 
   * @param {(string|Symbol)} [opts.property] The property name or Symbol.
   *   This is the property that will be set on objects that are tagged
   *   with this InternalObjectId. Default is `Symbol(this.id)`.
   * @param {boolean} [opts.useInstance=true] Store object or id value?
   *   If this is `true` (now the default), we store the instance itself.
   *   If this is `false` (the old default), we store just the `id` value.
   */
  constructor(opts={})
  {
    this.name = opts.name;
    this.id = opts.id ?? randomNumber();
    this.property = opts.property ?? Symbol(this.id);
    this.useInstance = opts.useInstance ?? true; 
  }

  /**
   * Tag an object with the ObjectId.
   * 
   * @param {*} obj - The object to tag with the unique object id.
   * @returns {*} `obj`
   */
  tag(obj)
  {
    if (isNil(obj)) throw new TypeError("Cannot tag a null or undefined value");
    const val = this.useInstance ? this : this.id;
    return def(obj, this.property, val);
  }

  /**
   * Remove the tag from a tagged object.
   * 
   * @param {*} obj 
   */
  untag(obj)
  {
    if (notNil(obj))
    {
      delete(obj[this.property]);
    }
    return obj;
  }

  /**
   * Is the specified object tagged with this object id?
   * 
   * @param {*} obj - The object to test.
   * @returns {boolean} If it's tagged or not.
   */
  is(obj)
  {
    const want = this.useInstance ? this : this.id;
    return (notNil(obj) && obj[this.property] === want);
  }

  /**
   * Generate a function that calls `instance.is()`
   * 
   * @returns {function} The wrapper function.
   */
  isFunction()
  {
    const oid = this;
    return function(obj) { return oid.is(obj); }
  }

}

exports.InternalObjectId = InternalObjectId;
