/**
 * Object helpers sub-module.
 * @module @lumjs/core/obj
 */

const copyAll = require('./copyall');
const copyProps = require('./copyprops');
const {CLONE,clone,addClone,cloneIfLocked} = require('./clone');
const {lock,addLock} = require('./lock');
const {mergeNested,syncNested} = require('./merge');
const ns = require('./ns');
const 
{
  getObjectPath,setObjectPath,
  getNamespace,setNamespace,
} = ns;

module.exports =
{
  CLONE, clone, addClone, cloneIfLocked, lock, addLock,
  mergeNested, syncNested, copyProps, copyAll, ns,
  getObjectPath, setObjectPath, getNamespace, setNamespace,
}
