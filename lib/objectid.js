'use strict';

const {isObj,isComplex,isProperty,F,N,S,SY} = require('./types');
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

//exports.randomNumber = randomNumber;

const validBase = (base) => (typeof base === N && base > 1 && base < 37);

/**
 * A class for generating unique ids for objects.
 * 
 * @param {object} [opts] Named options;
 * Will be assigned to `this.options` property.
 * 
 * There are three mutually-exclusive options that will determine
 * how ids are generated. They are checked for in a specific order:
 * 
 * - `opts.random`
 * - `opts.timestamp`
 * - `opts.incremental`
 * 
 * The first one that has a truthful value will be used and the
 * others won't be checked at all. If none of them are specified,
 * then `incremental` mode will be used as the default.
 * 
 * @param {number} [opts.radix=16] Base for id numbers.
 * We use `16` (hexadecimal) as the default.
 * 
 * @param {(number|boolean)} [opts.incremental] Use incremental ids.
 * 
 * - A number will override `opts.radix`.
 * - Boolean true may be used for consistency with the other modes,
 *   but is not required at all, as this is the default mode.
 * - Boolean false will show a warning message if none of the other
 *   modes were enabled, as in that case incremental mode will be
 *   forced as the default.
 * 
 * @param {(object|number|boolean)} [opts.random] Use random ids.
 * 
 * The numeric portion of ids will be generated via randomNumber().
 * 
 * - An object will be used as named options for randomNumber();
 *   for any value other than an object, default options are used.
 * - A number will override `opts.radix`.
 * - Boolean true enables random ids without overriding anything.
 * 
 * @param {(number|boolean)} [opts.timestamp] Use timestamps as ids.
 * 
 * - A number will override `opts.radix`.
 * - Boolean true enables timestamps without overriding anything.
 * 
 * @alias module:@lumjs/core.UniqueObjectIds
 */
class UniqueObjectIds
{
  constructor(opts={})
  {
    df(this, 'options', {value: opts});

    let radix = opts.radix ?? 16;

    if (opts.random)
    {
      let randOpts;
      if (isObj(opts.random))
      {
        randOpts = opts.random;
      }
      else if (typeof opts.random === N)
      {
        radix = opts.random;
        randOpts = {};
      }
      df(this, '$randOpts', {value: randOpts});
    }
    else if (opts.timestamp)
    { // Use timestamp-based ids.
      df(this, '$timeIds', {value: {}});
      if (validBase(opts.timestamp))
      {
        radix = opts.timestamp;
      }
    }
    else
    { // Use incremental ids.
      df(this, '$incIds',  {value: {}});
      if (validBase(opts.incremental))
      {
        radix = opts.incremental;
      }
      else if (opts.incremental === false)
      {
        console.error("no modes enabled; forcing incremental ids");
      }
    }

    if (!radix)
    {
      radix = validBase(opts.radix) ? opts.radix : 16;
    }

    df(this, '$radix', radix);

    if (this.$randOpts)
    {
      df(this, '$randIds',  {value: {}});
    }
    
    let propType = (typeof opts.idProperty),
        hasProp  = (propType === S || propType === SY),
        useRegistry = (opts.useRegistry ?? !hasProp),
        reg = null;

    if (useRegistry)
    { // Using an internal registry to store ids.
      if (useRegistry instanceof TaggedObjects)
      {
        reg = useRegistry;
      }
      else
      { // ↓ TODO: `s/property/tagProperty/` in v2.x
        let ro = Object.assign({property: false}, opts, {useRegistry});
        reg = new TaggedObjects(ro);
      }
    }
    else if (!hasProp)
    { // At least ONE of them MUST be used!
      throw new RangeError("Need one of 'useRegistry' or 'idProperty'");
    }

    df(this, 'metadata', {value: reg});

    if (hasProp)
    { // Add a direct reference to the id property key.
      df(this, '$idProp', {value: opts.idProperty});
    }
  }

  id(obj)
  {
    let metadata = this.metadata?.for(obj);
    if (metadata && metadata.uid)
    { // Found the id in the registry metadata.
      return metadata.uid;
    }

    const idProp = this.$idProp;

    if (idProp && obj[idProp])
    { // An existing object id was found in the object's id property.
      return obj[idProp];
    }

    let radix = this.$radix;

    let cno = this.options.className ?? {};
    if (typeof cno === F)  cno = {setup: cno};
    else if (cno === 'lc') cno = {lowercase: true};
    else if (cno === 'uc') cno = {uppercase: true};

    let id = '', idNum = null;

    if (typeof this.options.prefix === S)
    {
      id += this.options.prefix; 
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
        const start = this.options.startAt ?? 1;
        ids[className] = start;
        if (!this.options.skipFirst)
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
      if (typeof this.options.infix  === S)
      {
        id += this.options.infix;
      }
      id += idNum;
    }

    if (idProp)
    {
      df(obj, idProp, {value: id});
    }

    if (metadata)
    { // Set the uid.
      metadata.uid = id;
    }

    return id;
  } // id()

} // UniqueObjectIds class

//exports.UniqueObjectIds = UniqueObjectIds;

/**
 * A class that allows tagging objects for specific purposes.
 * 
 * This was originally used solely as a way to identify internal objects,
 * and its classname was InternalObjectId (an alias to which will continue
 * to exist for the duration of v1.x).
 * 
 * In v1.38.5 however it was redesigned to support using an internal registry
 * instead of a unique property on the object itself, and with this came the
 * ability to define custom metadata for any tagged objects. So I renamed it,
 * and updated the UniqueObjectIds class to support using an instance of this
 * for its own internal registry (replacing the Map it used previously).
 * 
 * @alias module:@lumjs/core.TaggedObjects
 */
class TaggedObjects
{
  /**
   * Build a unique TaggedObjects instance.
   * 
   * @param {object} [opts] Named options to change default behaviours.
   * @param {string} [opts.name] A friendly name for diagnostics.
   * @param {(string|number)} [opts.id] An internal id value.
   * 
   * A reasonable default will be generated if it's not specified.
   * 
   * @param {(string|symbol|false)} [opts.property] **DEPRECATED**
   * 
   * Use `opts.tagProperty` instead of this which is the older name.
   * This is currently supported as an alias, but will be removed in v2.x.
   * 
   * @param {boolean} [opts.useInstance=true] Store object or id value?
   * 
   * - If this is true (now the default), we use `this` instance as the tag.
   * - If this is false (the old default), we use `this.id` as the tag.
   * 
   * @param {boolean} [opts.useRegistry=false] Register tagged items?
   * 
   * If this is true, then `this.registry` will be created as a Map instance,
   * and every object/function passed to tag() will be added as a key, with
   * a plain object that can be used for arbitrary metadata as the value.
   * 
   * If both this and `opts.tagProperty` are false, an error will be thrown.
   * 
   * @param {(string|symbol|false)} [opts.tagProperty] Tag property.
   * 
   * This is the property that will be set on objects that are tagged
   * with this TaggedObjects. Default is a unique (non-global) `Symbol`.
   * 
   * If explicitly set to false, no property will be assigned.
   * 
   * If both this and `opts.useRegistry` are false, an error will be thrown.
   * 
   * @throws {RangeError} If `useRegistry` and `tagProperty` are both false.
   */
  constructor(opts={})
  {
    let ui = this.useInstance = opts.useInstance ?? true;
    this.name = opts.name;
    this.id = opts.id ?? (ui ? Date.now() : randomNumber());
    this.property = opts.tagProperty 
      ?? opts.property 
      ?? Symbol(this.name ?? this.id);
    this.options = opts;

    if (opts.useRegistry)
    {
      this.registry = new Map();
    }
    else if (!isProperty(this.property))
    {
      throw new RangeError("Need one of 'useRegistry' or 'tagProperty'");
    }
  }

  /**
   * Get metadata for an object.
   * 
   * If the object 
   * 
   * This is ONLY able to be used if `opts.useRegistry` was true
   * when creating the intance. An error will be thrown otherwise.
   * 
   * @param {(object|function)} obj - Target to get metadata for.
   * @returns {object} Metadata.
   */
  for(obj)
  {
    if (!this.registry) throw new Error("No registry");
    if (!this.registry.has(obj))
    { // Tag the object.
      this.tag(obj);
    }
    return this.registry.get(obj);
  }

  /**
   * Tag an object with the ObjectId.
   * 
   * @param {(object|function)} obj - The target to tag.
   * @returns {(object|function)} `obj`
   */
  tag(obj)
  {
    if (!isComplex(obj)) throw new TypeError("Invalid tag target");

    if (this.registry)
    {
      if (!this.registry.has(obj))
      { // Initialize the metadata.
        this.registry.set(obj, {});
      }
      if (this.property === false)
      {
        return obj;
      }
    }
    
    const val = this.useInstance ? this : this.id;
    return df(obj, this.property, val);
  }

  /**
   * Remove the tag from a tagged object.
   * 
   * @param {(object|function)} obj - The target to untag.
   * @returns {(object|function)} `obj`
   */
  untag(obj)
  {
    if (isComplex(obj))
    {
      if (this.registry)
      {
        this.registry.delete(obj);
      }

      if (this.property !== false)
      {
        delete(obj[this.property]);
      }
    }

    return obj;
  }

  /**
   * Is the specified object tagged with this object id?
   * 
   * @param {(object|function)} obj - The object to test.
   * @returns {boolean} If it's tagged or not.
   */
  is(obj)
  {
    if (this.registry)
    {
      return this.registry.has(obj);
    }
    const want = this.useInstance ? this : this.id;
    return (isComplex(obj) && obj[this.property] === want);
  }

  /**
   * Generate a closure that calls `instance.is()`
   * 
   * @returns {function} The closure function.
   */
  isFunction()
  {
    return obj => this.is(obj);
  }

}

module.exports = 
{
  InternalObjectId: TaggedObjects,
  randomNumber,
  TaggedObjects,
  UniqueObjectIds,
  validBase,
}

const {df} = require('./obj/df');
