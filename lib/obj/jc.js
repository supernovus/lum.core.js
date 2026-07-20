'use strict';

const { isObj } = require('../types/basics');

/**
 * Simple object cloning using JSON passthrough.
 * @param {object} obj - Object to clone.
 * @param {object} [opts] Options.
 * @param {object} [opts.json] Options for JSON serialisation.
 * @param {function} [opts.json.replace] Replacer for JSON.str[ingify();
 * @param {function} [opts.json.revive] Reviver for JSON.parse();
 * @param {function} [opts.jsonReplace] Alias for `opts.json.replace`.
 * @param {function} [opts.jsonRevive] Alias for `opts.json.revive`.
 * @returns {object} A clone of the object.
 * @alias module:@lumjs/core/obj.jc
 */
function jsonClone(obj, opts={}) {
  let jo = isObj(opts.json) ? opts.json : opts;
  let rep = jo.replace ?? jo.jsonReplace;
  let rev = jo.revive ?? jo.jsonRevive;
  return JSON.parse(JSON.stringify(obj, rep), rev);
}

module.exports = jsonClone;
