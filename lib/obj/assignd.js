"use strict";

const def = require('../types/def');

/**
 * Copy properties into a target object.
 * 
 * Like Object.assign(), but it uses getOwnPropertyDescriptors()
 * to get the properties to copy and type.def() to assign them.
 * 
 * Basically a super simple, non-recursive replacement for my copyProps()
 * and cp() functions that were overly complex and tried to do way too much.
 * 
 * @param {object} target - The target object to copy properties into
 * @param {...object} sources - Source objects to copy properties from
 * @returns {object} the `target` object
 * 
 * @alias module:@lumjs/core/obj.assignd
 */
function assignd (target, ...sources)
{
  for (const src of sources)
  {
    const descs = Object.getOwnPropertyDescriptors(src);
    def(target, descs);
  }
  return target;
}

module.exports = assignd;
