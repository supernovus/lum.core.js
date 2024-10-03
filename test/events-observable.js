// Tests of observable API (compatibility wrapper)

const {plan,run} = require('./inc/observable');
const {makeObservable} = require('../lib/events/observable')
const t = require('@lumjs/tests').new({module, plan});
const testOpts = {appendEvent: true}
run(t, makeObservable, testOpts);

// All done.
t.done();
