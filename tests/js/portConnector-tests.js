/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/*global jqUnit */
// TODO: These have to be run last or they will cause problems with subsequent tests.
// I have tried adding more rigid stop/start calls, but that seems not to help.
// I suspect additional listener calls or faulty start/stop logic are to blame.
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.registerNamespace("youme.test.portConnector");

    jqUnit.module("Input port connector tests");

    jqUnit.test("We should be able to connect to an input by changing the selected port ID.", function () {
        jqUnit.expect(2);

        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var portOpenListener = function () {
            jqUnit.start();
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
        };

        jqUnit.stop();
        var that = youme.portConnector.input({
            listeners: {
                onPortOpen: portOpenListener
            }
        });

        that.events.onCreate.then(function () {
            jqUnit.start();
            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));
            jqUnit.stop();
            that.applier.change("portSpec", { id: "input2" } );
        });
    });

    jqUnit.test("We should be able to connect to an input on startup.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.portConnector.input({ model: { portSpec: { id: "input1" }}});
        that.events.onCreate.then(function () {
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
        });
    });

    jqUnit.test("We should be able to disconnect from an input.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.portConnector.input({ model: { portSpec: {id: "input1"}}});
        that.events.onCreate.then(function () {
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));

            var transaction = that.applier.initiate();
            transaction.fireChangeRequest({ path: "portSpec", type: "DELETE" });
            transaction.commit();

            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));
        });
    });

    jqUnit.test("No connection should be created when the portSpec matches multiple ports.", function () {
        youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var that = youme.portConnector.input({ model: { portSpec: { name: "sample input" }}});
        that.events.onCreate.then(function () {
            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));
        });
    });

    jqUnit.test("A connection should be created when a matching port is added.", function () {
        var webMidiMock = youme.tests.createWebMidiMock();

        var that = youme.portConnector.input({ model: { portSpec: { id: "new" }}});

        that.events.onCreate.then(function () {
            jqUnit.assertEquals("There should be no connection.", 0, youme.tests.countChildComponents(that, "youme.connection.input"));

            webMidiMock.addPort({ type: "input", id: "new"});

            jqUnit.assertEquals("There should be a connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));
        });
    });

    jqUnit.test("We should be able to receive messages from an input port.", function () {
        jqUnit.expect(2);

        var webMidiMock = youme.tests.createWebMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};

        var onPortOpenListener = function () {
            jqUnit.start();
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.input"));

            var access = webMidiMock.accessEventTargets[0];
            var inputPort = access.inputs.get("input1");

            var midiEvent = new Event("midimessage");
            midiEvent.data = youme.write(sampleMessage);

            jqUnit.stop();
            inputPort.dispatchEvent(midiEvent);
        };

        var noteOnListener = function (midiMessage) {
            jqUnit.start();
            jqUnit.assertDeepEq("The received message should be as expected.", sampleMessage, midiMessage);
        };

        // Stop to wait for port to be opened.
        jqUnit.stop();

        var that = youme.portConnector.input({
            model: {
                portSpec: { id: "input1" }
            },
            listeners: {
                "onPortOpen.startChecks": {
                    func: onPortOpenListener
                },
                "onNoteOn.checkResults": {
                    func: noteOnListener
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

        var that = youme.portConnector.output({ model: { portSpec: { id: "output" }}});
        that.events.onCreate.then(function () {
            jqUnit.assertEquals("There should be one connection.", 1, youme.tests.countChildComponents(that, "youme.connection.output"));

            var access = webMidiMock.accessEventTargets[0];
            var outputPort = access.outputs.get("output");

            that.events.sendNoteOn.fire(sampleMessage);
            jqUnit.assertDeepEq("The message should have been sent.", [expectedData], outputPort.calls.send[0]);
        });
    });
})(fluid);
