/**
 * Object helpers sub-module.
 * @module @lumjs/core/obj
 */

const {apply,ApplyInfo,ApplyOpts,ApplyWith} = require('./apply');
const assignd = require('./assignd');
const {copyAll,duplicateOne,duplicateAll} = require('./copyall');
const copyProps = require('./copyprops');
const {CLONE,clone,addClone,cloneIfLocked} = require('./clone');
const {df,dfa,dfor,lazy} = require('./df');
const {flip, flipKeyVal, flipMap} = require('./flip');
const {getMethods,signatureOf,MethodFilter} = require('./getmethods');
const getProperty = require('./getproperty');
const getPrototypesOf = require('./getprotos');
const {lock,addLock} = require('./lock');
const {mergeNested,syncNested} = require('./merge');
const ns = require('./ns');
const cp = require('./cp');
const unlocked = require('./unlocked');
const ownCount = require('./owncount');

const 
{
  getObjectPath,setObjectPath,delObjectPath,
  getNamespace,setNamespace,nsFactory,
} = ns;

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
module.exports =
{
  assignd, cp, CLONE, clone, addClone, cloneIfLocked, lock, addLock,
  df, dfa, dfor, lazy, discrete,
  mergeNested, syncNested, copyProps, copyAll, ns, nsFactory,
  getObjectPath, setObjectPath, delObjectPath, getNamespace, setNamespace,
  getProperty, duplicateAll, duplicateOne, getMethods, signatureOf,
  MethodFilter, flip, flipKeyVal, flipMap, unlocked, getPrototypesOf,
  apply, ApplyInfo, ApplyOpts, ApplyWith, ownCount,
}
