/**
 * Functions for working with options and default values.
 * @module @lumjs/core/opt
 */

const argOpts = require('./opts');
const getPath = require('./getpath');
const {val,get} = require('./getval');

exports = module.exports =
{
  argOpts, get, getPath, val,
}

const lazy = require('../types/lazy');
lazy(exports, 'Opts', () => require('./opts'));
