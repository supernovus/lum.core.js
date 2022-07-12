// Object helper utilities.
// We *could* use `copyAll` to simply merge everything in here automatically.
// But I'm going to be more explicit and import everything I want separately.
// I may change my mind on that in the future, who knows.

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
