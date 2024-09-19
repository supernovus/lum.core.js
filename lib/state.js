"use strict";

const {S,isObj} = require('./types')
const ctx = require('./context')
const stateSym  = Symbol('@lumjs/core/state')
const stateData = {[stateSym]: false}
const stateKey  = 'LUM_JS_STATE'
const stateOpts = {}

module.exports =
{
  get(opts={})
  {
    if (opts.refresh || !stateData[stateSym])
    {
      let json;
      if (ctx.isNode)
      {
        json = process.env[stateKey];
      }
      else if (ctx.isBrowser)
      {
        json = localStorage.getItem(stateKey);
      }
  
      if (typeof json === S)
      {
        const revive = opts.jsonRevive ?? stateOpts.jsonRevive;
        const storedData = JSON.parse(json, revive);
        if (isObj(storedData))
        {
          Object.assign(stateData, storedData);
          stateData[stateSym] = true;
        }
      }
    }
    return stateData;
  },

  save(opts={})
  {
    if (!stateData[stateSym]) return false;
  
    const replace = opts.jsonReplace ?? stateOpts.jsonReplace;
    const json = JSON.stringify(stateData, replace);
  
    if (ctx.isBrowser)
    {
      localStorage.setItem(stateKey, json);
    }
    else if (ctx.isNode)
    {
      console.log("export ", stateKey, "=", json);
    }
  },

  opts: stateOpts,
  
  [stateSym]: stateData,
  $$: stateSym,
}
