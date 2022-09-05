
const {notNil,def,isNil} = require('./types');

/**
 * Generate a large random number.
 * 
 * @returns {number}
 * @alias module:@lumjs/core.randomNumber
 */
function randomNumber()
{
  return Math.floor(Math.random() * Date.now());
}

exports.randomNumber = randomNumber;

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
