'use strict';

const indOf = (arr, ind) => (ind < 0) ? (arr.length + ind) : ind;
const indexes = (arr, inds) => {
  for (let ind in inds) {
    inds[ind] = indOf(arr, inds[ind]);
  }
  return inds;
}

/**
 * Move an array item to a new position.
 *
 * Negative position values will be from the end of the Array.
 *
 * This will directly MODIFY the array!
 *
 * @param {Array} array - Array we are moving the item in.
 * @param {number} a - Current position of item to move.
 * @param {number} b - Position to move the item to.
 * @param {boolean} [rp=false] Return the calculated positions?
 * @returns {(Array|module:@lumjs/core/arrays~Position)}
 * If `rp` is false this will return the original array.
 */
function move(array, a, b, rp=false) {
  let pos = indexes(array, {a, b});
  if (pos.a !== pos.b) {
    array.splice(pos.b, 0, ...array.splice(pos.a, 1));
  }
  return rp ? pos : array;
}

/**
 * Swap the positions of two items in an array.
 *
 * Negative position values will be from the end of the Array.
 *
 * This will directly MODIFY the array!
 * 
 * @param {Array} array - Array we are swapping items in.
 * @param {number} a - Current position of item to move.
 * @param {number} b - Position to move the item to.
 * @param {?Array} [moves=null] Return calculated positions?
 * 
 * If this argument is supplied, the array will be populated with
 * either one or two Position objects (from the move() function).
 * 
 * If `a` and `b` are directly next to each other there will be
 * only one Position object as only one call to move() is required.
 * 
 * If they are more than 1 position away from each other there
 * will be two Position objects, the first being from moving `a`
 * to `b` and the second moving `b` to `a`.
 * 
 * @returns {(Array|module:@lumjs/core/arrays~Position[])}
 * The return value will be `moves` if it was set, or `array` otherwise.
 */
function swap(array, a, b, moves=null) {
  let rp = Array.isArray(moves);
  let pos = move(array, a, b, true);
  if (rp) moves.push(pos); 
  if (pos.a !== pos.b) {
    let n2 = (pos.a < pos.b) ? pos.b -1 : pos.b + 1;
    if (n2 !== pos.a) {
      pos = move(array, n2, pos.a, true);
      if (rp) moves.push(pos);
    }
  }

  return rp ? moves : array;
}

/**
 * Return a Powerset of values in the array.
 * @param {Array} array  The array to make the powerset from.
 * @returns {Array}  The powerset.
 * @alias module:@lumjs/core/arrays.powerset
 */
function powerset(array) 
{
  var ps = [[]];
  for (var i=0; i < array.length; i++) 
  {
    // we modify the ps array in the next loop,
    // so can't use the ps.length property directly in the loop condition.
    var current_length = ps.length;
    for (var j = 0; j < current_length; j++) 
    {
      ps.push(ps[j].concat(array[i]));
    }
  }
  return ps;
}

/**
 * Get a random element from an array.
 * @param {Array} array  The array to get an item from.
 * @returns {mixed}  The randomly selected item.
 * @alias module:@lumjs/core/arrays.random
 */
function random(array)
{
  return array[Math.floor(Math.random()*array.length)];
}

module.exports = exports =
{
  move, powerset, random, swap,
}

/**
 * Position movement info.
 * 
 * All positions in this will be the final calculated positions
 * after conversion of negative arguments and offsets in two-stage swaps.
 * 
 * @typedef {object} module:@lumjs/core/arrays~Position
 * @prop {number} a - Position item was moved from.
 * @prop {number} b - Position item was moved to.
 */
