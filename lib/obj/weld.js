'use strict';

const { isObj } = require('../types/basics');
const DEF_UPDATE = { configurable: false, writable: false }
const ENVAL = (desc) => (desc.enumerable && desc.value !== undefined);
const YES = () => true;

/**
 * Modify specific property descriptors all at once.
 * 
 * The default behaviour with no options will make all enumerable
 * non-accessor properties completely read-only.
 * 
 * @param {(object|function)} obj - The target to modify.
 * @param {object} [opts] Options.
 * @param {module:@lumjs/core/obj~WeldDescs} [opts.descriptors] 
 * Test for descriptors to update.
 * 
 * You don't have to test for `configurable` in the test function, 
 * as non-configurable properties are skipped automatically.
 * 
 * The default if this is not specified will allow any descriptors
 * where `enumerable` is true, and a `value` is defined.
 * 
 * @param {module:@lumjs/core/obj~WeldKeys} [opts.keys] 
 * Test for property keys to update.
 * 
 * A second test that can be used to filter the properties that will
 * be updated by their property key.
 * 
 * The default if this is not specified allows ALL keys.
 * 
 * @param {object} [opts.update] Changes to apply to descriptors.
 * 
 * The default is: `{configurable: false, writable: false}`;
 * if you specify this manually, the defaults won't be used at all.
 * 
 * @returns {object} The `obj` after updating the property descriptors.
 * @alias module:@lumjs/core/obj.weld
 */
function weld(obj, opts = {}) {
  let descTest = (typeof opts.descriptors === 'function')
    ? opts.descriptors
    : ENVAL;
  let keyTest = (typeof opts.keys === 'function')
    ? opts.keys
    : YES;
  let update = isObj(opts.update) ? obj.update : DEF_UPDATE;
  let descs = Object.getOwnPropertyDescriptors(obj);

  for (let key in descs) {
    let desc = descs[key];
    if (!desc.configurable) continue;   // Non-configurable
    if (!descTest(desc, key)) continue; // Did not pass descriptor test
    if (!keyTest(key, desc)) continue;  // Did not pass key test

    Object.assign(desc, update);
    Object.defineProperty(obj, key, desc);
  }

  return obj;
}

module.exports = weld;

/**
 * Test for allowed property descriptors.
 * @callback module:@lumjs/core/obj~WeldDescs
 * @param {object} desc - Descriptor object for a property.
 * @param {(string|symbol)} [key] Property key.
 * @returns {boolean} Should the property descriptor be updated?
 */

/**
 * Test for allowed property keys.
 * @callback module:@lumjs/core/obj~WeldKeys
 * @param {(string|symbol)} key - Property key.
 * @param {object} [desc] Descriptor object for a property.
 * @returns {boolean} Should the property descriptor be updated?
 */
