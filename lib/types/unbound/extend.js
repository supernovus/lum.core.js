"use strict";

const def = require('../def');
const {needObj} = require('../needs');
const removeFromArray = require('../../arrays/list').removeItems;
const unboundObjects = require('./objects');

// Adds a couple magic methods to the `unbound` function.
module.exports = function(unbound)
{
  /**
   * Add an item to the unbound global objects list.
   * 
   * @function
   * @param {(object|function)} obj - The object to be considered unbound.
   * @returns {boolean} Will be `false` if `obj` is already unbound.
   * @throws {TypeError} If `obj` was neither an `object` nor a `function`.
   * @name module:@lumjs/core/types.unbound.add
   */
  def(unbound, 'add', function (obj)
  {
    needObj(obj, true);
    if (unbound(obj, true, true))
    { // Item is already unbound.
      return false;
    }
    // Add to list and we're done.
    unboundObjects.push(obj);
    return true;
  });

  /**
   * Remove an item from the unbound global objects list.
   * 
   * @function
   * @param {(object|function)} obj - The object to be removed.
   * @returns {boolean} Will be `false` if the item was not in the list.
   * @throws {TypeError} If `obj` was neither an `object` nor a `function`.
   * @name module:@lumjs/core/types.unbound.remove
   */
  def(unbound, 'remove', function(obj)
  {
    needObj(obj, true);
    return (removeFromArray(unboundObjects, obj) > 0);
  });
}
