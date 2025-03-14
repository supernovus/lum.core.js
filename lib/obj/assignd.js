"use strict";

const {dfa} = require('./df');
const {isObj,isNil} = require('../types');

/**
 * Copy properties into a target object.
 * 
 * Like Object.assign(), but it uses getOwnPropertyDescriptors() to get
 * the properties to copy, and [dfa()]{@link module:@lumjs/core/obj.dfa} 
 * to assign them.
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
    if (isObj(src))
    {
      const descs = Object.getOwnPropertyDescriptors(src);
      dfa(target, descs);
    }
    else if (!isNil(src))
    {
      console.error("Invalid assignd source", {src, sources, target});
    }
  }
  return target;
}

module.exports = assignd;
