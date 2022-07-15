// Current test count.
const plan = 1;
// A new test instance.
const t = require('@lumjs/tests').new({module, plan});
// The meta core module
const meta = require('../lib/meta');

t.dies(()=>meta.NYI(), 'NYI()');

// TODO:
// - stacktrace()
// - AbstractClass
// - Functions.*

// All done.
t.output();

