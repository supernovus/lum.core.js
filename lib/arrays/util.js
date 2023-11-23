
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
  powerset, random,
}
