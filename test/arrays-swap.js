// Current test count.
const plan = 6;
// A new test instance.
const t = require('@lumjs/tests').new({ module, plan });
// The arrays core module
const { move, swap } = require('../lib/arrays');

const orig = Object.freeze(['hello', 'darkness', 'my', 'old', 'friend']);

let cur = move(orig.slice(), 2, 3);

let want = ['hello', 'darkness', 'old', 'my', 'friend'];
t.isJSON(cur, want, 'move(a, 2, 3)');

let moves = swap(cur, 2, 3, []);

t.isJSON(cur, orig, 'swap(a, 3, 2)');

want = [{a: 2, b: 3}];
t.isJSON(moves, want, 'one-step swap moves');

move(cur, 0, -1);

want = ['darkness','my','old','friend','hello'];
t.isJSON(cur, want, 'cur.move(0, -1)');

moves = swap(cur, 1, -2, []);

want = ['darkness','friend','old','my','hello'];
t.isJSON(cur, want, 'cur.swap(1, -2)');

want = [{a: 1, b: 3}, {a: 2, b: 1}];
t.isJSON(moves, want, 'two-step swap moves');

// All done.
t.done();
