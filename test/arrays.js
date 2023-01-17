// Current test count.
const plan = 5;
// A new test instance.
const t = require('@lumjs/tests').new({module, plan});
// The arrays core module
const arr = require('../lib/arrays');

t.ok(arr.containsAny(['hello','world'], 'world'), 'containsAny([a], a)');
t.ok(!arr.containsAny(['hello','world'], 'universe'), '!containsAny([a], b)');
t.ok(arr.containsAll(['hello','darkness','my','old','friend'], 'hello', 'friend'), 'containsAll([a,b,c], a, c)');
t.ok(!arr.containsAll(['nothing','to','see'], 'nothing', 'here'), '!containsAll([a,b,c], a, d)');

const a1 = ['hello', 'darkness', 'my', 'old', 'friend'];
arr.removeItems(a1, 'darkness');
t.isJSON(a1, ['hello','my','old','friend'], 'removeFromArray(...)');

// All done.
t.done();

