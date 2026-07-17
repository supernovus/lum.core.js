"use strict";

const {dfa} = require('./df');
const {isIterable,isNil,isObj} = require('../types/basics');
const cp = Object.assign;
const ASSIGN_OPTS = Symbol('@lumjs/core/obj.assignd.OPTS');
const DEF_OPTS = { 
  force: 'configurable',
  fromCall: false,
  withInfo: false,
  withWarn: true,
}

// Private ctx.from() method
function assignFrom(src, info={})
{
  if (this.opts.fromCall && typeof src === 'function')
  { // May be enabled in the target options only.
    src.call(this, info, this);
    return info;
  }
  else if (!isObj(src)) 
  {
    return { err: ['Invalid assignment source', info], ok: false }
  }

  let descs = Object.getOwnPropertyDescriptors(src);
  let opts = src[ASSIGN_OPTS] ?? {}; // source-specific opts
  let skip = [...this.skip];

  if (isIterable(opts.skip)) skip.push(...opts.skip);
  opts = cp({}, this.opts, opts); // compose target and source opts

  for (let sk of skip) 
  {
    delete descs[sk];
  }

  return {
    ctx: this, descs, info, opts, skip, src,
    get count() {
      return Object.keys(descs).length;
    },
    get ok() {
      return this.count > 0;
    },
  }
}

// Private ctx.with() method
function assignWith(cb)
{
  if (typeof cb !== 'function')
  {
    console.error(this.fn, {cb, ctx: this});
    throw new TypeError('Invalid callback function');
  }

  let info = { ctx: this, done: false, processed: [], }

  for (let src of this.sources)
  {
    let so = this.from(src, info);
    info.processed.push(so);

    if (so.ok)
    {
      cb.call(so, so);
    }
    else if (this.opts.withWarn && so.err)
    {
      let errs = isIterable(so.err) ? so.err : [so.err];
      console.error(...errs);
    }

    if (info.done) break;
  }

  return this.opts.withInfo ? info : this.target;
}

// Private function that powers assignd()
function assignTo(target, sources, fn) 
{
  if (!isObj(target))
  {
    console.error(fn, {target, sources});
    throw new TypeError('Invalid assignment target');
  }

  let skip = [ASSIGN_OPTS]; // property keys to skip in assignments
  let opts = cp({}, DEF_OPTS, target[ASSIGN_OPTS]);
  if (isIterable(opts.skip)) skip.push(...opts.skip);

  return {
    fn, 
    from: assignFrom, 
    opts, 
    skip, 
    sources,
    target,
    with: assignWith,
  }
}

assignTo.from = assignFrom;
assignTo.with = assignWith;

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
 * If you create a `source[assignd.OPTS]` property as an object, the options
 * specified in it will take priority over options set in the `target`,
 * and only apply to that single source object.
 * 
 * If a `skip` source option is specified, it will be used *in addition* to
 * the skip option from the target.
 * 
 * @returns {object} the `target` object
 * 
 * @alias module:@lumjs/core/obj.assignd
 */
function assignd (target, ...sources)
{
  let ctx = assignTo(target, sources, 'assignd');
  return ctx.with(so => dfa(target, so.descs, so.opts));
}

dfa(assignd, {
  OPTS: ASSIGN_OPTS,
  $to: assignTo,
});

module.exports = { assignd };
