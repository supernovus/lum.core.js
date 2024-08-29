/**
 * Object helpers sub-module.
 * @module @lumjs/core/obj
 */

const apply = require('./apply');
const {copyAll,duplicateOne,duplicateAll} = require('./copyall');
const copyProps = require('./copyprops');
const {CLONE,clone,addClone,cloneIfLocked} = require('./clone');
const {flip, flipKeyVal, flipMap} = require('./flip');
const {getMethods,signatureOf,MethodFilter} = require('./getmethods');
const getProperty = require('./getproperty');
const {lock,addLock} = require('./lock');
const {mergeNested,syncNested} = require('./merge');
const ns = require('./ns');
const cp = require('./cp');

const 
{
  getObjectPath,setObjectPath,
  getNamespace,setNamespace,
} = ns;

module.exports =
{
  cp, CLONE, clone, addClone, cloneIfLocked, lock, addLock,
  mergeNested, syncNested, copyProps, copyAll, ns,
  getObjectPath, setObjectPath, getNamespace, setNamespace,
  getProperty, duplicateAll, duplicateOne, getMethods, signatureOf,
  MethodFilter, apply, flip, flipKeyVal, flipMap,
}
