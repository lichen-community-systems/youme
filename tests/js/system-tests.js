/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/* globals jqUnit */
(function (fluid, jqUnit) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    jqUnit.test("The system should come up correctly when there are no ports.", function () {
        jqUnit.expect(2);
        youme.tests.createWebMidiMock();

        jqUnit.stop();
        var system = youme.system({});

        system.events.onCreate.then(function () {
            jqUnit.start();
            jqUnit.assertEquals("There should be no input ports.", 0, Object.keys(system.model.ports.inputs).length);
            jqUnit.assertEquals("There should be no output ports.", 0, Object.keys(system.model.ports.outputs).length);
        });
    });

    jqUnit.test("The system should manage its state change listener.", function () {
        jqUnit.expect(2);
        var mock = youme.tests.createWebMidiMock();

        jqUnit.stop();
        var that = youme.system();
        that.events.onCreate.then(function () {
            jqUnit.start();
            jqUnit.assertTrue("A state change callback should have been attached to the mock.", typeof mock.accessEventTargets[0].onstatechange === "function");

            that.destroy();
            jqUnit.assertEquals("The state change callback should be removed from the mock when the component shuts down.", undefined, mock.onstatechange);
        });
    });

    jqUnit.test("The system should be able to handle access rejection.", function () {
        jqUnit.expect(1);
        youme.tests.createWebMidiMock({ rejectAccess: true});
        youme.system({
            listeners: {
                "onAccessError": {
                    funcName: "jqUnit.assert",
                    args: ["An onAccessError event should be fired when access is rejected."]
                }
            }
        });
    });

    jqUnit.test("The system should respond appropriately when the browser doesn't support MIDI.", function () {
        jqUnit.expect(2);
        navigator.requestMIDIAccess = false;

        var accessErrorListener = function () {
            jqUnit.start();
            jqUnit.assert("An onAccessError event should be fired when no MIDI support is available.");
        };

        jqUnit.stop();

        try {
            youme.system({
                listeners: {
                    "onAccessError": {
                        func: accessErrorListener
                    }
                }
            });
        }
        catch (error) {
            jqUnit.assert("Component creation should have thrown an error.");
        }
    });

    jqUnit.test("The system should come up correctly when there are ports.", function () {
        jqUnit.expect(2);
        youme.tests.createWebMidiMock({
            inputSpecs: { r2m: { type: "input", id: "6789", name: "R2M", manufacturer: "Doepfer"} },
            outputSpecs: { jv: { type: "output", id: "9876", name: "JV-1010", manufacturer: "Roland"} }
        });

        jqUnit.stop();
        var portsAvailableListener = function () {
            jqUnit.start();
            jqUnit.assertEquals("There should be an input port.", 1, Object.keys(system.model.ports.inputs).length);
            jqUnit.assertEquals("There should be a output port.", 1, Object.keys(system.model.ports.outputs).length);
        };

        var system = youme.system({
            listeners: {
                "onPortsAvailable": {
                    func: portsAvailableListener,
                    args: ["{that}"]
                }
            }
        });
    });

    // Previously this test used two levels of async stop/start cycles, one for startup, one for listeneing for the port
    // add.  This succeeded on its own but caused problems in subsequent tests.  The current setup avoids using any
    // asynchrony, but may need to be rewritten in the future.
    jqUnit.test("The system should respond correctly when a port is added.", function () {
        jqUnit.expect(2);
        var mock = youme.tests.createWebMidiMock();

        var that = youme.system();

        that.events.onCreate.then(function () {
            jqUnit.assertEquals("There should be no input ports.", 0, Object.keys(that.model.ports.inputs).length);

            mock.addPort({ type: "input", id: "1234", name: "Launchpad Pro", manufacturer: "Novation"});

            jqUnit.assertEquals("There should be an input port.", 1, Object.keys(that.model.ports.inputs).length);
        });
    });
})(fluid, jqUnit);
