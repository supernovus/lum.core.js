'use strict';

/**
 * Get both string and symbol keys from an object.
 * @param {object} obj - Target object.
 * @returns {(string|symbol)[]}
 */
const getOwnKeys = obj => [
  ...(Object.getOwnPropertyNames(obj)),
  ...(Object.getOwnPropertySymbols(obj)),
];

/**
 * See if an object has its own properties.
 */
const isEmptyObject = obj => getOwnKeys(obj).length === 0;

module.exports = {getOwnKeys, isEmptyObject}
