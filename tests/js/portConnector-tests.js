/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/*global jqUnit */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.registerNamespace("youme.test.portConnector");

    // The `youme.system` component needs to complete its own setup for ports to be visible elsewhere.  Since this is
    // the only sequence of asynchronous events we need to occur before we can run our tests, we handle it using a
    // single listener rather than full Fluid IoC tests.
    fluid.defaults("youme.test.portConnector.testRunner", {
        runTests: fluid.notImplemented,
        components: {
            midiSystem: {
                options: {
                    listeners: {
                        "onReady.runTests": {
                            func: "{youme.test.portConnector.testRunner}.options.runTests",
                            args: ["{youme.portConnector}"]
                        }
                    }
                }
            }
        }
    });

    fluid.defaults("youme.test.portConnector.input", {
        gradeNames: ["youme.portConnector.input", "youme.test.portConnector.testRunner"]
    });

    fluid.defaults("youme.test.portConnector.output", {
        gradeNames: ["youme.portConnector.output", "youme.test.portConnector.testRunner"]
    });

    jqUnit.module("Input port connector tests");

    jqUnit.test("We should be able to connect to an input by changing the selected port ID.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        jqUnit.stop();

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));

            that.applier.change("portSpec", { id: "input2" } );

            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        youme.test.portConnector.input({ runTests: runTests });
    });

    jqUnit.test("We should be able to connect to an input on startup.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        jqUnit.stop();

        youme.test.portConnector.input({
            model: {
                portSpec: { id: "input1" }
            },
            runTests: runTests
        });
    });

    jqUnit.test("We should be able to disconnect from an input.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        jqUnit.stop();

        var runTests = function (that) {
            jqUnit.start();

            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));

            var transaction = that.applier.initiate();
            transaction.fireChangeRequest({ path: "portSpec", type: "DELETE" });
            transaction.commit();

            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        youme.test.portConnector.input({
            model: {
                portSpec: { id: "input1" }
            },
            runTests: runTests
        });
    });

    jqUnit.test("No connection should be created when the portSpec matches multiple ports.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        jqUnit.stop();

        youme.test.portConnector.input({
            model: {
                portSpec: { name: "sample input" }
            },
            runTests: runTests
        });
    });

    jqUnit.test("A connection should be created when a matching port is added.", function () {
        var webMidiMock = youme.tests.createWebMidiMock();

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));

            webMidiMock.addPort({ type: "input", id: "new"});

            jqUnit.assertEquals("There should be a connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        jqUnit.stop();

        youme.test.portConnector.input({
            model: {
                portSpec: { id: "new" }
            },
            runTests: runTests
        });
    });

    jqUnit.test("We should be able to receive messages from an input port.", function () {
        var webMidiMock = youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
            jqUnit.stop();
        };

        var portOpenListener = function () {
            var access = webMidiMock.accessEventTargets[0];
            var inputPort = access.inputs.get("input1");

            var midiEvent = new Event("midimessage");
            midiEvent.data = youme.write(sampleMessage);

            inputPort.dispatchEvent(midiEvent);
        };

        // Stop to wait for `youme.system` to be ready (when runTests will be run).
        jqUnit.stop();

        var noteOnListener = function (midiMessage) {
            jqUnit.start();
            jqUnit.assertDeepEq("The received message should be as expected.", sampleMessage, midiMessage);
        };

        youme.test.portConnector.input({
            model: {
                portSpec: { id: "input1" }
            },
            runTests: runTests,
            listeners: {
                "onNoteOn.checkResults": {
                    func: noteOnListener
                }
            },
            dynamicComponents: {
                connection: {
                    options: {
                        listeners: {
                            "onPortOpen.sendMessage": {
                                priority: "after:startListening",
                                func: portOpenListener
                            }
                        }
                    }
                }
            }
        });
    });

    jqUnit.module("Output port connector tests");

    jqUnit.test("We should be able to send messages to an output port.", function () {
        var webMidiMock = youme.tests.createWebMidiMock({
            outputSpecs: {
                output: { type: "output", id: "output", name: "sample output"}
            }
        });

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};
        var expectedData = youme.write(sampleMessage);

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.output"));

            var access = webMidiMock.accessEventTargets[0];
            var outputPort = access.outputs.get("output");

            that.events.sendNoteOn.fire(sampleMessage);
            jqUnit.assertDeepEq("The message should have been sent.", [expectedData], outputPort.calls.send[0]);
        };

        jqUnit.stop();

        youme.test.portConnector.output({
            model: {
                portSpec: { id: "output" }
            },
            runTests: runTests
        });
    });
})(fluid);
