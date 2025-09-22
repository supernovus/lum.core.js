"use strict";

const {df,dfa} = require('./df');
const {isObj,isIterable,isNil} = require('../types');
const cp = Object.assign;
const ASSIGND_OPTS = Symbol('@lumjs/core/obj.assignd~opts');
const DEF_OPTS = {force: 'configurable'};

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
 * The default options used by this function when calling dfa() are:
 * 
 * `{configurable: true, force: 'configurable'}`
 * 
 * Which simply means that by default the `configurable` descriptor property
 * will be forced to `true` on the properties assigned, allowing them to be
 * re-assigned later. You can override the defaults using special properties
 * in either the target or source objects.
 * 
 * @param {object} target - The target object to copy properties into.
 * 
 * If you create a `target[assignd.OPTS]` property as an object, it may be
 * used to set any of the options supported by the dfa() function.
 * The options specified here take priority over the defaults shown above,
 * and will be used for all sources.
 * 
 * In addition to the options supported by dfa(), an additional `skip`
 * option may be specified, it should be an array of property keys that
 * SHOULD NOT be overwritten in the target. The `assignd.OPTS` property
 * is always implicitly in the skip list and will never be overridden.
 * 
 * @param {...object} sources - Source objects to copy properties from.
 * 
 * If you create a `source[assignd.OPTS]` property as an object, it may be
 * used to set any of the options supported by the dfa() function.
 * The options specified here take priority over any set in the `target`,
 * and only apply to that specific source object.
 * 
 * The options assigned to source objects do NOT support the `skip` option.
 * 
 * @returns {object} the `target` object
 * 
 * @alias module:@lumjs/core/obj.assignd
 */
function assignd (target, ...sources)
{
  const skips = [ASSIGND_OPTS];
  const topts = cp({}, DEF_OPTS, target[ASSIGND_OPTS]);

  if (isIterable(topts.skip))
  {
    skips.push(...topts.skip);
  }

  for (const src of sources)
  {
    if (isObj(src))
    {
      const sopts = cp({}, topts, src[ASSIGND_OPTS]);
      const descs = Object.getOwnPropertyDescriptors(src);
      for (let skip of skips)
      {
        delete descs[skip];
      }
      dfa(target, descs, sopts);
    }
    else if (!isNil(src))
    {
      console.error("Invalid assignd source", {src, sources, target});
    }
  }

  return target;
}

df(assignd, 'OPTS', {value: ASSIGND_OPTS});

module.exports = assignd;
