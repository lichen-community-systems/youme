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

    jqUnit.module("Multiport Input connector tests");

    jqUnit.test("We should be able to connect to a single input.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.multiPortConnector.inputs();

        jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));

        that.applier.change("portSpecs", [{ id: "input2" }] );

        jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));

    });

    jqUnit.test("We should be able to connect to multiple inputs.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.multiPortConnector.inputs();

        jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));

        that.applier.change("portSpecs", [{ id: "input2" }, { id: "input1"}] );

        jqUnit.assertEquals("There should be two connections.", 2, youme.tests.countChildComponents(that, "youme.connection.input"));

    });

    jqUnit.test("We should be able to connect to an input on startup.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.multiPortConnector.inputs({ model: { portSpecs: [{ id: "input1" }]}});

        jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
    });

    jqUnit.test("We should be able to disconnect from an input.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.multiPortConnector.inputs({
            model: {
                portSpecs: [{ id: "input1" }]
            }
        });

        jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));

        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: "portSpecs", type: "DELETE" });
        transaction.commit();

        jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));
    });

    jqUnit.test("Multiple connections should be created when the portSpec matches multiple ports.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.multiPortConnector.inputs({ model: { portSpecs: [{ name: "sample input" }]}});

        jqUnit.assertEquals("There should be two connections.", 2, youme.tests.countChildComponents(that, "youme.connection.input"));
    });

    jqUnit.test("We should be able to relay messages from connections to the multiport connector.", function () {
        var webMidiMock = youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};

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

        var that = youme.multiPortConnector.outputs({ model: { portSpecs: [{ name: "sample output" }]}});

        jqUnit.assertEquals("There should be two connections.", 2, youme.tests.countChildComponents(that, "youme.connection.output"));

        var access = webMidiMock.accessEventTargets[0];
        var outputPort1 = access.outputs.get("output1");
        var outputPort2 = access.outputs.get("output2");

        that.events.sendNoteOn.fire(sampleMessage);
        jqUnit.assertDeepEq("The message should have been sent to the first port.", [expectedData], outputPort1.calls.send[0]);
        jqUnit.assertDeepEq("The message should have been sent to the second port.", [expectedData], outputPort2.calls.send[0]);
    });

    jqUnit.module("Input -> Output relay tests.");

    fluid.defaults("youme.test.multiPortConnector.relay", {
        gradeNames: ["fluid.modelComponent"],
        runTests: fluid.notImplemented,

        events: {
            inputsReady: null,
            outputsReady: null,
            onReady: {
                events: {
                    inputsReady: "inputsReady",
                    outputsReady: "outputsReady"
                }
            }
        },
        components: {
            inputs: {
                type: "youme.multiPortConnector.inputs",
                options: {
                    model: {
                        portSpecs: [{ name: "sample input"}]
                    },
                    dynamicComponents: {
                        connection: {
                            options: {
                                listeners: {
                                    "onPortOpen.notifyParent": {
                                        priority: "after:startListening",
                                        func: "{youme.test.multiPortConnector.relay}.events.inputsReady.fire"
                                    }
                                }
                            }
                        }
                    },
                    listeners: {
                        "onMessage.sendToOutput": "{outputs}.events.sendMessage.fire"
                    }
                }
            },
            outputs: {
                type: "youme.multiPortConnector.outputs",
                options: {
                    model: {
                        portSpecs: [{ name: "sample output"}]
                    },
                    dynamicComponents: {
                        connection: {
                            options: {
                                listeners: {
                                    "onPortOpen.notifyParent": {
                                        priority: "after:startListening",
                                        func: "{youme.test.multiPortConnector.relay}.events.outputsReady.fire"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        listeners: {
            "onReady.runTests": {
                func: "{youme.test.multiPortConnector.relay}.options.runTests",
                args: ["{that}"]
            }
        }
    });

    jqUnit.test("We should be able to connect a multiPort input to a multiPort output.", function () {
        var webMidiMock = youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            },
            outputSpecs: {
                output1: { type: "output", id: "output1", name: "sample output 1"},
                output2: { type: "output", id: "output2", name: "sample output 2"}
            }
        });

        var runTests = function (that) {
            jqUnit.start();
            jqUnit.assertEquals("There should be two inputs.", 2, youme.tests.countChildComponents(that.inputs, "youme.connection.input"));
            jqUnit.assertEquals("There should be two outputs.", 2, youme.tests.countChildComponents(that.outputs, "youme.connection.output"));

            var access = webMidiMock.accessEventTargets[0];
            var outputPort1 = access.outputs.get("output1");
            var outputPort2 = access.outputs.get("output2");

            var inputPort1 = access.inputs.get("input1");
            var inputPort2 = access.inputs.get("input2");

            var firstSampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};
            var firstMessageExpectedData = youme.write(firstSampleMessage);

            var firstMidiEvent = new Event("midimessage");
            firstMidiEvent.data = firstMessageExpectedData;

            inputPort1.dispatchEvent(firstMidiEvent);

            jqUnit.assertDeepEq("A message should have been sent from the first input to the first output.", [firstMessageExpectedData], outputPort1.calls.send[0]);
            jqUnit.assertDeepEq("A message should have been sent from the first input to the second output.", [firstMessageExpectedData], outputPort2.calls.send[0]);


            var secondSampleMessage = { type: "noteOff", channel: 0, velocity: 0, note: 89};
            var secondMessageExpectedData = youme.write(secondSampleMessage);

            var secondMidiEvent = new Event("midimessage");
            secondMidiEvent.data = secondMessageExpectedData;

            jqUnit.stop();

            // TODO: Discuss a cleaner pattern for "all my dynamic children are ready" scenarios.
            // Required because we can't cleanly add a listener for the addListener mechanism on all ports.
            setTimeout(function () {
                jqUnit.start();
                inputPort2.dispatchEvent(secondMidiEvent);
                jqUnit.assertDeepEq("A message should have been sent from the second input to the first output.", [secondMessageExpectedData], outputPort1.calls.send[1]);
                jqUnit.assertDeepEq("A message should have been sent from the second input to the second output.", [secondMessageExpectedData], outputPort2.calls.send[1]);
            }, 100);
        };

        jqUnit.stop();

        youme.test.multiPortConnector.relay({
            runTests: runTests
        });
    });
})(fluid);
