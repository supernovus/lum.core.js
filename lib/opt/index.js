/**
 * Functions for working with options and default values.
 * @module @lumjs/core/opt
 */

const argOpts = require('./args');
const {getPath,isPath} = require('./getpath');
const {val,get} = require('./getval');

exports = module.exports =
{
  argOpts, get, getPath, isPath, val,
}

const {wrapDepr} = require('../meta');
wrapDepr(exports, 'Opts',
{
  dep: '@lumjs/core.opt.Opts',
  rep: '@lumjs/opts',
  get: () => require('@lumjs/opts'),
});
