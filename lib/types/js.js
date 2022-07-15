// Fundamental core types.
const O='object', F='function', S='string', B='boolean', N='number',
      U='undefined', SY='symbol', BI='bigint';

/**
 * One or two character identifiers for the core JS type names.
 * 
 * These are only the strings returned by the `typeof` operator.
 * See the `TYPES` object (defined in `typelist.js`) for a list
 * that includes special types and compound pseudo-types, etc.
 */
module.exports = {O, F, S, B, N, U, SY, BI};
