/**
 * Object helpers sub-module.
 * @module @lumjs/core/obj
 */

const {apply,ApplyInfo,ApplyOpts,ApplyWith} = require('./apply');
const {assignd} = require('./assignd');
const {df,dfa,dfor,lazy} = require('./df');
const {flip, flipKeyVal, flipMap} = require('./flip');
const {getMethods,signatureOf,MethodFilter} = require('./getmethods');
const getProperty = require('./getproperty');
const getPrototypesOf = require('./getprotos');
const jc = require('./jc');
const ns = require('./ns');
const unlocked = require('./unlocked');
const ownCount = require('./owncount');
const {getOwnKeys,isEmptyObject} = require('./keys');
const {weaveAll, weaveAny} = require('./weave');
const weld = require('./weld');

const 
{
  getObjectPath,setObjectPath,delObjectPath,
  getNamespace,setNamespace,nsFactory,
} = ns;

// Deprecated functions; TODO: remove in 2.0
const NSO = '@lumjs/core/obj';
const { deprecateAll } = require('../meta');
const cp = deprecateAll(require('./cp'), NSO+'/cp');

/**
 * Create a new object with a `null` prototype.
 * 
 * @alias module:@lumjs/core/obj.discrete
 * 
 * Unlike regular objects, discrete objects won't have any
 * of the usual meta-programming methods or properties.
 * Not sure why you'd want that, but anyway, here you go.
 * 
 * @param {object} [props] Optional properties to define in
 * the new object. Uses the same format as Object.defineProperties()
 * 
 * @returns {object}
 */
const discrete = (props) => Object.create(null, props);

// TODO: reorder the following alphabetically, for sanity sake...
exports = module.exports =
{
  cp, // TODO: remove this line in 2.0

  apply, ApplyInfo, ApplyOpts, ApplyWith, assignd, 
  delObjectPath, df, dfa, dfor, discrete, flip, flipKeyVal, flipMap,
  getMethods, getNamespace, getObjectPath, getOwnKeys, getProperty, 
  getPrototypesOf, isEmptyObject, jc, lazy, MethodFilter, ns, nsFactory,
  ownCount, setNamespace, setObjectPath, signatureOf, unlocked,
  weaveAll, weaveAny, weld,
}

// Deprecated collections; TODO: remove in 2.0
deprecateAll(require('@lumjs/cp/fun'), NSO, exports);
deprecateAll(require('@lumjs/cp/util'), NSO, exports);
