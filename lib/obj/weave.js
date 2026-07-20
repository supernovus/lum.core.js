'use strict';

const { isNil, isPlainObject } = require('../types/basics');

/**
 * Recursively merge all enumerable properties into a target object.
 * 
 * Only enumerable properties from the source objects will be merged.
 * Properties that are plain objects, such as object literals, or objects
 * returned from JSON.parse(), will be recursed into. Any other objects
 * or non-object values will be assigned as-is.
 * 
 * Like Object.assign(), this will overwrite existing properties in the
 * target, including those added by previous sources.
 * 
 * @param {object} target - Object to merge enumerable properties into.
 * @param {...object} sources - Source objects to merge properties from.
 * @returns {object} The target after all merging has been completed.
 */
function weaveAll(target, ...sources) {
  for (let src of sources) {
    for (let key in src) {
      let sv = src[key];
      if (isPlainObject(sv)) {
        if (!isPlainObject(target[key])) {
          target[key] = {}
        }
        weaveAll(target[key], sv);
      }
      else {
        target[key] = from[key];
      }
    }
  }
  return target;
}

/**
 * Recursively merge any enumerable properties into a target object.
 * 
 * This does almost exactly the same thing as `weaveAll()`, except that this
 * will NOT overwrite existing properties.
 * 
 * @param {object} target - Object to merge enumerable properties into.
 * @param {...object} sources - Source objects to merge properties from.
 * @returns {object} The target after all merging has been completed.
 */
function weaveAny(target, ...sources) {
  for (let src of sources) {
    for (let key in src) {
      let sv = src[key];
      if (isPlainObject(sv)) {
        if (isNil(target[key])) {
          target[key] = {}
        }
        else if (!isPlainObject(target[key])) {
          continue; // skip incompatible properties
        }
        weaveAny(target[key], sv);
      }
      else if (isNil(target[key])) {
        target[key] = from[key];
      }
    }
  }
  return target;
}

module.exports = { weaveAll, weaveAny }
