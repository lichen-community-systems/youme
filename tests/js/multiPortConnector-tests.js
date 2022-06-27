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

    fluid.registerNamespace("youme.test.multiPortConnector");

    // The `youme.system` component needs to complete its own setup for ports to be visible elsewhere.  Since this is
    // the only sequence of asynchronous events we need to occur before we can run our tests, we handle it using a
    // single listener rather than full Fluid IoC tests.
    fluid.defaults("youme.test.multiPortConnector.testRunner", {
        runTests: fluid.notImplemented,
        components: {
            midiSystem: {
                options: {
                    listeners: {
                        "onReady.runTests": {
                            func: "{youme.test.multiPortConnector.testRunner}.options.runTests",
                            args: ["{youme.multiPortConnector}"]
                        }
                    }
                }
            }
        }
    });

    fluid.defaults("youme.test.multiPortConnector.inputs", {
        gradeNames: ["youme.multiPortConnector.inputs", "youme.test.multiPortConnector.testRunner"]
    });

    fluid.defaults("youme.test.multiPortConnector.outputs", {
        gradeNames: ["youme.multiPortConnector.outputs", "youme.test.multiPortConnector.testRunner"]
    });

    jqUnit.module("Multiport Input connector tests");

    jqUnit.test("We should be able to connect to a single input.", function () {
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

            that.applier.change("portSpecs", [{ id: "input2" }] );

            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        youme.test.multiPortConnector.inputs({ runTests: runTests });
    });

    jqUnit.test("We should be able to connect to multiple inputs.", function () {
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

            that.applier.change("portSpecs", [{ id: "input2" }, { id: "input1"}] );

            jqUnit.assertEquals("There should be two connections.", 2, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        youme.test.multiPortConnector.inputs({ runTests: runTests });
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

        youme.test.multiPortConnector.inputs({
            model: {
                portSpecs: [{ id: "input1" }]
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
            transaction.fireChangeRequest({ path: "portSpecs", type: "DELETE" });
            transaction.commit();

            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        youme.test.multiPortConnector.inputs({
            model: {
                portSpecs: [{ id: "input1" }]
            },
            runTests: runTests
        });
    });

    jqUnit.test("Multiple connections should be created when the portSpec matches multiple ports.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be two connections.", 2, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        jqUnit.stop();

        youme.test.multiPortConnector.inputs({
            model: {
                portSpecs: [{ name: "sample input" }]
            },
            runTests: runTests
        });
    });

    jqUnit.test("We should be able to relay messages from connections to the multiport connector.", function () {
        var webMidiMock = youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};

        var runTests = function () {};

        var timesCalled = 0;
        var portOpenListener = function (that) {
            timesCalled++;
            if (timesCalled === 2) {
                jqUnit.start();
                jqUnit.assertEquals("There should be two connections.", 2, youme.tests.countChildComponents(that, "youme.connection.input"));
                var access = webMidiMock.accessEventTargets[0];

                var midiEvent = new Event("midimessage");
                midiEvent.data = youme.write(sampleMessage);

                var inputPort1 = access.inputs.get("input1");
                var inputPort2 = access.inputs.get("input2");

                inputPort1.dispatchEvent(midiEvent);
                inputPort2.dispatchEvent(midiEvent);

                jqUnit.assertEquals("Two messages should have been received.", 2, that.messagesReceived.length);
            }
        };

        // Stop to wait for `youme.system` to be ready (when runTests will be run).
        jqUnit.stop();

        youme.test.multiPortConnector.inputs({
            members: {
                messagesReceived: []
            },
            model: {
                portSpecs: [{ name: "sample input" }]
            },
            runTests: runTests,
            listeners: {
                "onNoteOn.recordMessage": {
                    funcName: "youme.test.multiPortConnector.recordMessage",
                    args: ["{that}", "{arguments}.0"]
                }
            },
            dynamicComponents: {
                connection: {
                    options: {
                        listeners: {
                            "onPortOpen.sendMessage": {
                                priority: "after:startListening",
                                func: portOpenListener,
                                args: ["{youme.test.multiPortConnector.inputs}"]
                            }
                        }
                    }
                }
            }
        });
    });

    youme.test.multiPortConnector.recordMessage = function (that, midiMessage) {
        that.messagesReceived.push(midiMessage);
    };

    jqUnit.module("Multiport output connector tests");

    jqUnit.test("We should be able to send messages to multiple output ports.", function () {
        var webMidiMock = youme.tests.createWebMidiMock({
            outputSpecs: {
                output1: { type: "output", id: "output1", name: "sample output"},
                output2: { type: "output", id: "output2", name: "sample output"}
            }
        });

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};
        var expectedData = youme.write(sampleMessage);

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be two connections.", 2, youme.tests.countChildComponents(that, "youme.connection.output"));

            var access = webMidiMock.accessEventTargets[0];
            var outputPort1 = access.outputs.get("output1");
            var outputPort2 = access.outputs.get("output1");

            that.events.sendNoteOn.fire(sampleMessage);
            jqUnit.assertDeepEq("The message should have been sent to the first port.", [expectedData], outputPort1.calls.send[0]);
            jqUnit.assertDeepEq("The message should have been sent to the second port.", [expectedData], outputPort2.calls.send[0]);
        };

        jqUnit.stop();

        youme.test.multiPortConnector.outputs({
            model: {
                portSpecs: [{ name: "sample output" }]
            },
            runTests: runTests
        });
    });
})(fluid);