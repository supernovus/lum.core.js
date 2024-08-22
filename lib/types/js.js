"use strict";

// A package-private collection of constants.
// Exported as a part of `basics` and `index`.
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
