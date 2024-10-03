// Tests of observable API (auto-selected implementation)

const {plan,run} = require('./inc/observable');
const observable = require('../lib/observable');
const t = require('@lumjs/tests').new({module, plan: plan*2});

// Normal calls should use the new implementation.
let testOpts = {appendEvent: true}
run(t, observable, testOpts);

// Try the old implementation via the `redefine` arg.
testOpts = {appendEvent: false, arg3: true}
run(t, observable, testOpts);

// All done.
t.done();
