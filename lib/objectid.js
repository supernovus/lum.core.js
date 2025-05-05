
const {notNil,def,isNil,isObj,F,N,S,SY} = require('./types');
const argOpts = require('./opt/args');

/**
 * Generate a random number.
 * 
 * @param {(object|number)} [opts] Options
 * 
 * If this is a number, then it's the `opts.seed` value.
 * 
 * @param {number} [opts.seed=0] A base number to use.
 *
 * If this is omitted, or an invalid value (including `0`), 
 * the default is to use `Date.now()` as `opts.seed`.
 * 
 * @param {number} [opts.mode=1] Determine how to handle return value
 * 
 * | Mode    | Description                                               |
 * | ------- | --------------------------------------------------------- |
 * | `0`     | Return unmodified floating point number                   |
 * | `1`     | `Math.round()` (default)                                  |
 * | `2`     | `Math.floor()`                                            |
 * | `3`     | `Math.ceil()`                                             |
 * 
 * @param {number} [mode=1] Positional version of `opts.mode`.
 * 
 * @returns {number}
 * @alias module:@lumjs/core.randomNumber
 */
function randomNumber(seed=0, mode=1)
{
  const opts = argOpts({seed, mode}, 'seed', 0);
  if (typeof opts.seed !== N || opts.seed === 0) 
    opts.seed = Date.now();

  const rand = Math.random() * seed;

  switch(mode)
  {
    case 1: return Math.round(rand);
    case 2: return Math.floor(rand);
    case 3: return Math.ceil(rand);
    default: return rand;
  }
}

exports.randomNumber = randomNumber;

const validBase = base => (typeof base === N && base > 1 && base < 37);

/**
 * A class for generating unique ids for objects.
 * 
 * TODO: document all the methods, etc.
 * 
 * @alias module:@lumjs/core.UniqueObjectIds
 */
class UniqueObjectIds
{
  constructor(opts={})
  {
    def(this, '$options', {value: opts});

    let radix = null;

    if (isObj(opts.random))
    { // Random ids with custom options.
      def(this, '$randOpts', {value: opts.random});
      if (validBase(opts.random.radix))
      {
        radix = opts.random.radix;
      }
    }
    else if (validBase(opts.random))
    { // Use random ids.
      def(this, '$randOpts', {value: {}});
      radix = opts.random;
    }
    else if (validBase(opts.timestamp))
    { // Use timestamp-based ids.
      def(this, '$timeIds', {value: {}});
      radix = opts.timestamp;
    }
    else
    { // Use incremental ids.
      def(this, '$incIds',  {value: {}});
    }

    if (!radix)
    {
      radix = validBase(opts.radix) ? opts.radix : 16;
    }

    def(this, '$radix', radix);

    if (this.$randOpts)
    {
      def(this, '$randIds',  {value: {}});
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

    let radix = this.$radix;

    let cno = this.$options.className ?? {};
    if (typeof cno === F)  cno = {setup: cno};
    else if (cno === 'lc') cno = {lowercase: true};
    else if (cno === 'uc') cno = {uppercase: true};

    let id = '', idNum = null;

    if (typeof this.$options.prefix === S)
    {
      id += this.$options.prefix; 
    }

    let className = (typeof obj === F ? obj : obj.constructor).name;

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
        idNum = (++ids[className]).toString(radix);
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
      let ids;
      if (this.$randIds)
      { // Using a random id.
        ids = this.$randIds;
      }
      else if (this.$timeIds)
      { // Using timestamp ids.
        ids = this.$timeIds;
      }
      else
      { // Something went horribly wrong.
        throw new Error("No id storage vars found");
      }

      const getId = () => (this.$randIds 
        ? randomNumber(this.$randOpts) 
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
   *   A reasonable default will be generated if it's not specified.
   * @param {(string|Symbol)} [opts.property] The property name or Symbol.
   *   This is the property that will be set on objects that are tagged
   *   with this InternalObjectId. Default is a unique (non-global) `Symbol`.
   * @param {boolean} [opts.useInstance=true] Store object or id value?
   *   If this is `true` (now the default), we store the instance itself.
   *   If this is `false` (the old default), we store just the `id` value.
   */
  constructor(opts={})
  {
    const ui = this.useInstance = opts.useInstance ?? true;
    this.name = opts.name;
    this.id = opts.id ?? (ui ? Date.now() : randomNumber());
    this.property = opts.property ?? Symbol(this.name ?? this.id);
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
    return obj => this.is(obj);
  }

}

exports.InternalObjectId = InternalObjectId;
