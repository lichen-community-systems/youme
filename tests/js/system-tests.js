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
        jqUnit.expect(5);
        var mock = youme.tests.createWebMidiMock();

        jqUnit.stop();
        var onReadyListener = function () {
            jqUnit.start();
            jqUnit.assert("An onReady event should have been fired when access is granted.");

            jqUnit.assertTrue("A state change callback should have been attached to the mock.", typeof mock.accessEventTargets[0].onstatechange === "function");

            jqUnit.assertEquals("There should be no input ports.", 0, Object.keys(system.model.ports.inputs).length);
            jqUnit.assertEquals("There should be no output ports.", 0, Object.keys(system.model.ports.outputs).length);

            system.destroy();
            jqUnit.assertEquals("The state change callback should be removed from the mock when the component shuts down.", undefined, mock.onstatechange);
        };

        var system = youme.system({ listeners: { "onReady": { func: onReadyListener } } });
    });

    jqUnit.test("The system should be able to handle access rejection.", function () {
        jqUnit.expect(1);
        youme.tests.createWebMidiMock({ rejectAccess: true});
        youme.system({
            listeners: {
                "onReady": {
                    funcName: "jqUnit.fail",
                    args: ["An onReady event should not have been fired."]
                },
                "onAccessError": {
                    funcName: "jqUnit.assert",
                    args: ["An onAccessError event should be fired when access is rejected."]
                }
            }
        });
    });

    jqUnit.test("The system should respond appropriately when the browser doesn't support MIDI.", function () {
        jqUnit.expect(1);
        navigator.requestMIDIAccess = false;
        youme.system({
            listeners: {
                "onReady": {
                    funcName: "jqUnit.fail",
                    args: ["An onReady event should not have been fired."]
                },
                "onAccessError": {
                    funcName: "jqUnit.assert",
                    args: ["An onAccessError event should be fired when no MIDI support is available.."]
                }
            }
        });
    });

    jqUnit.test("The system should come up correctly when there are ports.", function () {
        jqUnit.expect(2);
        youme.tests.createWebMidiMock({
            inputSpecs: { r2m: { type: "input", id: "6789", name: "R2M", manufacturer: "Doepfer"} },
            outputSpecs: { jv: { type: "output", id: "9876", name: "JV-1010", manufacturer: "Roland"} }
        });
        jqUnit.stop();

        var onReadyListener = function () {
            jqUnit.start();
            jqUnit.assertEquals("There should be an input port.", 1, Object.keys(system.model.ports.inputs).length);
            jqUnit.assertEquals("There should be a output port.", 1, Object.keys(system.model.ports.outputs).length);
        };

        var system = youme.system({ listeners: { onReady: { func: onReadyListener } } });
    });

    jqUnit.test("The system should respond correctly when a port is added.", function () {
        jqUnit.expect(2);
        var mock = youme.tests.createWebMidiMock();
        jqUnit.stop();
        var onReadyListener = function () {
            jqUnit.assertEquals("There should be no input ports.", 0, Object.keys(system.model.ports.inputs).length);

            mock.addPort({ type: "input", id: "1234", name: "Launchpad Pro", manufacturer: "Novation"});

            jqUnit.start();
            jqUnit.assertEquals("There should be an input port.", 1, Object.keys(system.model.ports.inputs).length);
        };
        var system = youme.system({ listeners: { onReady: { func: onReadyListener } } });
    });
})(fluid, jqUnit);
