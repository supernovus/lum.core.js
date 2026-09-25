"use strict";

const { dfa } = require('./df');
const { isIterable, isNil, isObj } = require('../types/basics');
const cp = Object.assign;
const ASSIGN_OPTS = Symbol('@lumjs/core/obj.assignd.OPTS');
const DEF_OPTS = {
  fn: 'assignd',
  force: 'configurable',
  fromCall: false,
  withInfo: false,
  withWarn: true,
}

// Private ctx.from() method
function assignFrom(src, info) {
  if (this.opts.fromCall && typeof src === 'function') {
    // May be enabled in the target options only.
    let res;
    try {
      res = src.call(this, info, this);
      if (!isObj(res)) {
        res = { ok: false, res, src }
      }
    }
    catch (err) {
      res = { err, ok: false, src };
    }
    return res;
  }

  if (isNil(src)) {
    return { ok: false }
  }
  if (!isObj(src)) {
    return { err: 'Invalid assignment source', ok: false, src }
  }

  let descs = Object.getOwnPropertyDescriptors(src);
  let opts = src[ASSIGN_OPTS] ?? {}; // source-specific opts
  let skip = [...this.skip];

  if (isIterable(opts.skip)) skip.push(...opts.skip);
  opts = cp({}, this.opts, opts); // compose target and source opts

  for (let sk of skip) {
    delete descs[sk];
  }

  return {
    descs, opts, skip, src,
    get count() {
      return Object.keys(descs).length;
    },
    get ok() {
      return this.count > 0;
    },
  }
}

// Private ctx.with() method
function assignWith(cb) {
  if (typeof cb !== 'function') {
    console.error(this.fn, { cb, ctx: this });
    throw new TypeError('Invalid callback function');
  }

  let info = { ctx: this, done: false, processed: [], }

  for (let src of this.sources) {
    let rv = this.from(src, info);
    info.processed.push(rv);
    let opts = rv.opts ?? this.opts;

    if (rv.ok) {
      cb.call(this, rv, info);
    }
    else if (opts.withWarn && rv.err) {
      let errs = isIterable(rv.err) ? rv.err : [rv.err];
      console.error(...errs, {src, info, rv});
    }

    if (info.done) break;
  }

  return this.opts.withInfo ? info : this.target;
}

const ATOMS = {
  from: assignFrom,
  with: assignWith,
}

/**
 * Low-level function that powers assignd().
 * @protected
 * @alias module:@lumjs/core/obj.assignTo
 * @param {(object|function)} target - Target object.
 * @param {(object|function)[]} sources - Sources to copy into target.
 * @param {object} [opts] Options; anything for `dfa()`, plus our own.
 * 
 * The options may also be set on the target option using the `assignd.OPTS`
 * symbol property key. The compiled options will include both sources,
 * with the target symbol taking priority.
 * 
 * @param {object} [opts.assign] Extra properties to add to context object.
 * @param {string} [opts.fn='assignd'] Function name for console logs.
 * @param {boolean} [opts.fromCall=false] Enable calling function sources?
 * @param {boolean} [opts.withInfo=false] Return the info object?
 * 
 * By default `ctx.with()` returns the `target`, but if you set this option
 * to true, it will return an info object with a lot of debugging info.
 * 
 * @param {boolean} [opts.withWarn=true] Log warnings to the console?
 * @returns {module:@lumjs/core/obj~AssignTo}
 */
function assignTo(target, sources, opts) {
  opts = cp({}, DEF_OPTS, opts, target[ASSIGN_OPTS]);
  let { fn } = opts;

  if (!isObj(target)) {
    console.error(fn, { target, sources });
    throw new TypeError('Invalid assignment target');
  }

  let skip = [ASSIGN_OPTS]; // property keys to skip in assignments
  if (isIterable(opts.skip)) skip.push(...opts.skip);

  return cp({}, ATOMS, opts.assign, {
    fn,
    opts,
    skip,
    sources,
    target,
  });
}

Object.defineProperty(assignTo, ASSIGN_OPTS, Object.freeze(ATOMS));

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
function assignd(target, ...sources) {
  let ctx = assignTo(target, sources);
  return ctx.with(so => dfa(target, so.descs, so.opts));
}

dfa(assignd, { OPTS: ASSIGN_OPTS });

module.exports = { assignd, assignTo };

/**
 * AssignTo Context.
 * @typedef {object} module:@lumjs/core/obj~AssignTo
 * @prop {string} fn - Function name for console logs.
 * @prop {module:@lumjs/core/obj~AssignFrom} from - Used by from().
 * @prop {object} opts - Compiled options.
 * @prop {(string|symbol)[]} skip - Keys to skip.
 * @prop {(object|function)[]} sources - Sources of properties.
 * @prop {(object|function)} target - Target to merge properties into.
 * @prop {module:@lumjs/core/obj~AssignWith} with - Primary method.
 */

/**
 * AssignTo Info; TODO: finish this.
 * @typedef {object} module:@lumjs/core/obj~AssignInfo
 * 
 */

/**
 * AssignFrom method.
 * @callback module:@lumjs/core/obj~AssignFrom
 * @param {(object|function)} src - Source being processed.
 * @param {module:@lumjs/core/obj~AssignInfo} info - Info object.
 */

/**
 * AssignFrom return value; TODO: finish this.
 * @callback module:@lumjs/core/obj~AssignStatus
 * @prop {boolean} ok - Indicates if assignment can proceed.
 * If this is false, assignWith will skip to the next source.
 * @prop {mixed} err - An error message. Only ever used when
 * `ok` is false, this will be sent to the console. If this
 * an array or other iterable, its contents will be sent to the
 * console, otherwise it will be sent directly.
 */

/**
 * AssignWith method.
 * @callback module:@lumjs/core/obj~AssignWith
 * @param {module:@lumjs/core/obj~AssignHandler} cb
 * @returns {(object|function)} May be the `info` object,
 * or `this.target` depending on the `this.opts.withInfo` value.
 */

/**
 * AssignWith assignment handler.
 * 
 * This is the function that will actually perform the assignment.
 * 
 * @callback module:@lumjs/core/obj~AssignHandler
 * @this module:@lumjs/core/obj~AssignTo
 * @param {object} rv - Return value from `ctx.from(src,info)`.
 * @param {module:@lumjs/core/obj~AssignInfo} info - Extended info.
 * @returns {mixed} The return value isn't used, so may be omitted.
 */
