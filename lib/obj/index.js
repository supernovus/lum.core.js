/**
 * Object helpers sub-module.
 * @module @lumjs/core/obj
 */

const apply = require('./apply');
const assignd = require('./assignd');
const {copyAll,duplicateOne,duplicateAll} = require('./copyall');
const copyProps = require('./copyprops');
const {CLONE,clone,addClone,cloneIfLocked} = require('./clone');
const {df,dfa,dfb,dfc,lazy} = require('./df');
const {flip, flipKeyVal, flipMap} = require('./flip');
const {getMethods,signatureOf,MethodFilter} = require('./getmethods');
const getProperty = require('./getproperty');
const {lock,addLock} = require('./lock');
const {mergeNested,syncNested} = require('./merge');
const ns = require('./ns');
const cp = require('./cp');
const unlocked = require('./unlocked');

const 
{
  getObjectPath,setObjectPath,delObjectPath,
  getNamespace,setNamespace,nsFactory,
} = ns;

module.exports =
{
  assignd, cp, CLONE, clone, addClone, cloneIfLocked, lock, addLock,
  df, dfa, dfb, dfc, lazy,
  mergeNested, syncNested, copyProps, copyAll, ns, nsFactory,
  getObjectPath, setObjectPath, delObjectPath, getNamespace, setNamespace,
  getProperty, duplicateAll, duplicateOne, getMethods, signatureOf,
  MethodFilter, apply, flip, flipKeyVal, flipMap, unlocked,
}
