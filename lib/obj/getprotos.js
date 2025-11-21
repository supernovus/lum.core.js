'use strict';

function getPrototypesOf(obj)
{ 
  let chain = [];
  while (true) 
  {
    if (obj && typeof obj === 'object') 
    {
      let objClass = obj.constructor;
      if (!chain.includes(objClass))
      {
        chain.push(objClass);
      }
      obj = getProto(obj);
    }
    else 
    {
      break;
    }
  }
  return chain;
}

module.exports = getPrototypesOf;
