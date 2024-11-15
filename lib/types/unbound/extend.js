"use strict";

const def = require('../def');
const {needObj} = require('../needs');
const unboundObjects = require('./objects');

// Adds a couple proxy methods to the `unbound` function.
module.exports = function(unbound)
{
  /**
   * Add an item to the unbound global objects list.
   * 
   * @deprecated the global list is going away in 2.0
   * @function module:@lumjs/core/types.unbound.add
   * @param {(object|function)} obj - Value to be added
   * @returns {boolean} always true as of v1.37.2
   * @throws {TypeError} If `obj` was not a valid value
   */
  def(unbound, 'add', function (obj)
  {
    needObj(obj, true);
    if (unboundObjects.has(obj)) return false;
    unboundObjects.add(obj);
    return true;
  });

  /**
   * Remove an item from the unbound global objects list.
   * 
   * @deprecated the global list is going away in 2.0
   * @function module:@lumjs/core/types.unbound.remove
   * @param {(object|function)} obj - value to be removed
   * @returns {boolean} always true as of v1.37.2
   * @throws {TypeError} If `obj` was not a valid value
   */
  def(unbound, 'remove', function(obj)
  {
    needObj(obj, true);
    unboundObjects.delete(obj);
    return true;
  });
}
