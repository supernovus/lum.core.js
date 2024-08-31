"use strict";

/**
 * An absolutely minimal map of one or two letter string constants
 * representing all of the fundamental JS types.
 * 
 * This object is *frozen* and cannot be modified in any way!
 * 
 * These are only the strings returned by the `typeof` operator.
 * See {@link module:@lumjs/core/types.TYPES} for a much more complete
 * list that includes special types and compound pseudo-types, etc.
 * 
 * @prop {string} O - object
 * @prop {string} F - function
 * @prop {string} S - string
 * @prop {string} B - boolean
 * @prop {string} N - number
 * @prop {string} U - undefined
 * @prop {string} SY - symbol
 * @prop {string} BI - bigint
 * 
 * @memberof module:@lumjs/core/types/basics
 */
const JS =
{
  O:  'object', 
  F:  'function', 
  S:  'string', 
  B:  'boolean', 
  N:  'number', 
  U:  'undefined', 
  SY: 'symbol',
  BI: 'bigint',
}

function addTo(target)
{
  for (const key in this)
  {
    const value = this[key];
    const desc = {value, enumerable: true};
    Object.defineProperty(target, key, desc);
  }
}

Object.defineProperty(JS, 'addTo', {value: addTo});

module.exports = Object.freeze(JS);
