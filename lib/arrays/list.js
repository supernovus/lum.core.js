
const {F,S} = require('../types');

/**
 * A wrapper class to abstract functionality of various kinds of lists.
 *
 * Supports `Array`, `Set`, and `Map` explicitly.
 * Other classes may be supported. YMMV.
 *
 * @alias module:@lumjs/core/arrays.List
 */
class List
{
  /**
   * A list of known closure properties.
   *
   * Corresponding `wrap_${closure}` methods will be used to generate
   * the closure properties.
   */
  static get KNOWN_CLOSURES()
  {
    return (Object.getOwnPropertyNames(this.prototype)
      .filter(name => name.startsWith('wrap_')));
  }

  /**
   * Build a new List wrapper.
   *
   * @param {object} obj - The list object.
   *
   * Typically an `Array`, `Set`, `Map`, or something similar.
   * Not all of types will support all features. YMMV.
   *
   * @param {object} [opts] Options for advanced use.
   *
   * @param {bool} [opts.allowRaw=false] Attempt to support raw objects?
   *
   * Treat regular Javascript objects as lists, as they are a kind of
   * map after all. This may lead to unusual results. YMMV.
   *
   * @param {mixed} [opts.closures=true] Create closure methods?
   *
   * If `true` or `"*"` we will create all known closure properties.
   *
   * If an `Array` it's the list of closure names we want to create.
   * Possible values can be found in `List.KNOWN_CLOSURES`.
   *
   * If it's a `string` it's treated as a whitespace separated list
   * of closure names and split into an `Array`.
   *
   * If `false` we won't create any closure properties.
   *
   */
  constructor(obj, opts={})
  {
    this.obj = obj;
    this.opts = opts;
    this.allowRaw = opts.allowRaw ?? false;
    this.setupClosures(opts.closures ?? true);  
  }

  setupClosures(closures)
  {
    if (!closures)
    { // Nothing to do.
      return;
    }

    if (closures === true || closures === '*')
    { // Setup all closures.
      closures = this.constructor.KNOWN_CLOSURES;
    }
    else if (typeof closures === S)
    {
      closures = closures.trim().split(/\s+/);
    }
    
    if (Array.isArray(closures))
    {
      for (const closure of closures)
      {
        const meth = 'wrap_'+closure;
        if (typeof this[meth] === F)
        { // Create the detail property.
          this[closure] = this[meth]();
        }
        else
        {
          console.error({closure, closures, list: this});
          throw new Error("Unsupported closure");
        }
      }
    }
    else
    {
      console.error({closures, list: this});
      throw new TypeError("Invalid closures value");
    }
  }

  unsupported(obj, forClosure, info, retVal=false)
  {
    console.error("Unsupported object", {obj, forClosure, info, list: this});
    return () => retVal;
  }

  /**
   * Return a closure that returns if an item is in a list object.
   *
   * @param {object} obj - The list object the closure will be for.
   *
   * May be an `Array`, `Set`, `Map`, or `TypedArray` or any object
   * that has either an `includes()` or `has()` method.
   *
   * @returns {function}
   * @throws {TypeError}
   */
  wrap_contains(obj=this.obj, allowRaw=this.allowRaw)
  {
    if (typeof obj.includes === F)
    { // Array and TypedArray have includes()
      return item => obj.includes(item);
    }
    else if (typeof obj.has === F)
    { // Set and Map have has()
      return item => obj.has(item);
    }
    else if (allowRaw)
    { // A fallback to raw object search.
      return item => (typeof obj[item] !== undefined);
    }
    else
    { // Nope.
      return this.unsupported(obj, 'contains', {allowRaw});
    }
  }

  /**
   * Return a closure that removes an item from a list.
   *
   * @param {object} obj - The list object the closure will be for.
   *
   * May be an `Array`, `Set`, `Map`, or anything with a `delete()` method.
   *
   * @returns {function}
   * @throws {TypeError}
   */
  wrap_remove(obj=this.obj, allowRaw=this.allowRaw)
  {
    let closure;
    if (Array.isArray(obj))
    { // Arrays have no easy method to do this.
      closure = function(item) 
      {
        let removed = 0;
        let index = obj.indexOf(item);
        while (index !== -1)
        {
          obj.splice(index, 1);
          removed++;
          index = obj.indexOf(item, index);
        }
        return removed;
      }
    }
    else if (typeof obj.delete === F)
    { // Use the delete() method.
      closure = item => (obj.delete(item) ?  1 : 0);
    }
    else if (allowRaw)
    { // Fallback to removing the property.
      closure = function(item)
      {
        if (obj[item] === undefined)
        {
          return 0;
        }
        else
        {
          return (delete obj[item] ? 1 : 0);
        }
      }
    }
    else
    { // Nada.
      closure = this.unsupported(obj, 'remove', {allowRaw}, 0);
    }
    return closure;
  }

  /** 
   * See if our list object contains *any* of the specified items.
   *
   * @param  {...any} items 
   * @returns {boolean}
   */
  containsAny(...items)
  {
    for (const item of items)
    {
      if (this.contains(item))
      { // Item found.
        return true;
      }
    }
 
    // No items found.
    return false;
  }

  /**
    * See if our list contains *all* of the specified items.
    *
    * @param  {...any} items 
    * @returns {boolean}
    */
  containsAll(...items)
  {
    for (const item of items)
    {
      if (!this.contains(item))
      { // An item was missing.
        return false;
      }
    }
    // All items found.
    return true;
  }

  /**
   * Remove items from our list object.
   * 
   * Passed any number of items, it will see if any of those items are
   * found in the array, and if they are, will remove them from the array.
   * 
   * @param  {...any} items 
   * @returns {number} Number of items actually removed.
   */
  removeAll(...items)
  {
    let removed = 0;
    for (const item of items)
    {
      removed += this.remove(item);
    }
    return removed;
  }

  /**
   * Return a List instance for the passed object.
   *
   * If the object is already a `List` it is returned as is.
   *
   * @param {object} obj - The list object.
   * @param {object} [opts] - Passed to constructor.
   */
  static for(obj, opts)
  {
    return (obj instanceof this) ? obj : new this(obj, opts);
  }
}

const CONTAINS_OPTS = {closures: ['contains']};

/** 
 * See if an list object contains *any* of the specified items.
 *
 * @param {object} list - A `List` or object for `new List(list)`;
 * @param  {...any} items 
 * @returns {boolean}
 * @alias module:@lumjs/core/arrays.containsAny
 */
function containsAny(list, ...items)
{
  return List.for(list, CONTAINS_OPTS).containsAny(...items);
}

List.containsAny = containsAny;

 /**
  * See if a list contains *all* of the specified items.
  *
  * @param {object} list - A `List` or object for `new List(list)`;
  * @param  {...any} items 
  * @returns {boolean}
  * @alias module:@lumjs/core/arrays.containsAll
  */
function containsAll(list, ...items)
{
  return List.for(list, CONTAINS_OPTS).containsAll(...items);
}

List.containsAll = containsAll;

const REMOVE_OPTS = {closures: ['remove']};

/**
 * Remove items from a list object.
 * 
 * Passed any number of items, it will see if any of those items are
 * found in the array, and if they are, will remove them from the array.
 * 
 * @param {object} list - A `List` or object for `new List(list)`; 
 * @param  {...any} items 
 * @returns {number} Number of items actually removed.
 * @alias module:@lumjs/core/arrays.removeItems
 */
function removeItems(list, ...items)
{
  return List.for(list, REMOVE_OPTS).removeAll(...items);
}

List.removeItems = removeItems;

module.exports = exports = List;
