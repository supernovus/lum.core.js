/**
 * A very simplistic Trait system.
 * @module @lumjs/core/traits
 */

"use strict";

const funcs = require('./funcs');
const Trait = require('./trait');
const regfns = require('./registry');

// Export all the things
Object.assign(exports, funcs, regfns, {Trait});
