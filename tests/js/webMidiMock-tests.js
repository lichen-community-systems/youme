/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/* eslint-env browser, es6, jquery */
/* globals jqUnit */(function (fluid, jqUnit) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    jqUnit.module("Tests for WebMIDI API Mock");

    jqUnit.test("We should be able to request access with no options.", async function () {
        jqUnit.expect(4);
        var webMidiMock = youme.tests.webMidiMock();
        jqUnit.assertEquals("There should be no calls in the register.", 0, webMidiMock.calls.requestMIDIAccess.length);

        var access = await webMidiMock.requestMIDIAccess();

        jqUnit.assertNotUndefined("The promise should have returned a value.", access);
        jqUnit.assertDeepEq("The access object should have been stored.", access, fluid.get(webMidiMock, "accessEventTargets.0"));
        jqUnit.assertDeepEq("Our arguments should have been stored in the call register.", [], webMidiMock.calls.requestMIDIAccess[0]);
    });

    jqUnit.test("We should be able to request access with custom options.", async function () {
        jqUnit.expect(4);
        var webMidiMock = youme.tests.webMidiMock();
        jqUnit.assertEquals("There should be no calls in the register.", 0, webMidiMock.calls.requestMIDIAccess.length);

        var requestArgs = { sysex: true };
        var access = await webMidiMock.requestMIDIAccess(requestArgs);
        jqUnit.assertTrue("Our access option should have been respected.", access.sysexEnabled);
        jqUnit.assertDeepEq("The access object should have been stored.", access, webMidiMock.accessEventTargets[0]);
        jqUnit.assertDeepEq("Our arguments should have been stored in the call register.", [requestArgs], webMidiMock.calls.requestMIDIAccess[0]);
    });

    jqUnit.test("We should be able to simulate a rejected access request.", async function () {
        jqUnit.expect(2);
        var webMidiMock = youme.tests.webMidiMock({ rejectAccess: true });

        try {
            await webMidiMock.requestMIDIAccess();
            jqUnit.fail("Our access request should have been rejected.");
        }
        catch (error) {
            jqUnit.assert("The promise was rejected as expected.");
            jqUnit.assertDeepEq("Our arguments should have been stored in the call register.", [], webMidiMock.calls.requestMIDIAccess[0]);
        }
    });

    jqUnit.test("We should be able to specify ports in our initial options.", async function () {
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"}
            },
            outputSpecs: {
                firstOutput: { type: "output", id: "output1", name: "sample output 1"}
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        // Inspect the access object returned by the promise.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", { id: "input1", name: "sample input 1" }, access.inputs.get("input1"));
        jqUnit.assertLeftHand("The output port mock should be part of the access object.", { id: "output1", name: "sample output 1" }, access.outputs.get("output1"));

        // Inspect the component's member variable.
        jqUnit.assertLeftHand("The input port mock should be stored in component.", { id: "input1", name: "sample input 1" }, webMidiMock.inputs.get("input1"));
        jqUnit.assertLeftHand("The output port mock should be stored in the component.", { id: "output1", name: "sample output 1" }, webMidiMock.outputs.get("output1"));
    });

    jqUnit.test("Our port expander should throw an error on an invalid port definition.", function () {
        var badOptionSpecs = {
            inputMissingId: {
                inputSpecs: {
                    firstBadInput: { type: "input" }
                }
            },
            outputMissingId: {
                outputSpecs: {
                    firstBadOutput: { type: "output" }
                }
            },
            inputMissingType: {
                inputSpecs: {
                    secondBadInput: { id: "input1" }
                }
            },
            outputMissingType: {
                outputSpecs: {
                    secondBadOutput: { id: "input1" }
                }
            },
            emptyInput: {
                inputSpecs: {
                    thirdBadInput: {}
                }
            },
            emptyOutput: {
                outputSpecs: {
                    thirdBadOutput: {}
                }
            }
        };

        fluid.each(badOptionSpecs, function (badOptions) {
            var explodingFunction = function () { youme.tests.webMidiMock(badOptions); };
            jqUnit.expectFrameworkDiagnostic("A bad option definition should cause component creation to fail.", explodingFunction, ["Cannot expand port definition"]);
        });
    });

    jqUnit.test("We should be able to listen for state changes with a named callback.", async function () {
        jqUnit.expect(3);

        var webMidiMock = youme.tests.webMidiMock();

        var access = await webMidiMock.requestMIDIAccess({ sysex: true });
        jqUnit.assert("We should have been granted access.");

        var addedPortSpec = { type: "input", id: "addInput", name: "added input"};
        jqUnit.stop();

        access.onstatechange = function () {
            jqUnit.start();

            jqUnit.assertLeftHand("The added input port mock should be part of the access object.", addedPortSpec, access.inputs.get("addInput"));
            jqUnit.assertLeftHand("The added input port mock should be stored in the component.", addedPortSpec, webMidiMock.inputs.get("addInput"));
        };

        webMidiMock.addPort(addedPortSpec);
    });

    jqUnit.test("We should be able to listen for state changes by adding a listener.", async function () {
        jqUnit.expect(3);

        var webMidiMock = youme.tests.webMidiMock();

        var access = await webMidiMock.requestMIDIAccess({ sysex: true });
        jqUnit.assert("We should have been granted access.");

        var addedPortSpec = { type: "output", id: "addOutput", name: "added output"};
        jqUnit.stop();

        access.addEventListener("statechange", function () {
            jqUnit.start();

            jqUnit.assertLeftHand("The added output port mock should be part of the access object.", addedPortSpec, access.outputs.get("addOutput"));
            jqUnit.assertLeftHand("The added output port mock should be stored in the component.", addedPortSpec, webMidiMock.outputs.get("addOutput"));
        });

        webMidiMock.addPort(addedPortSpec);
    });

    jqUnit.test("An invalid port definition should cause an error when adding a port.", async function () {
        // You have to omit the expectFrameworkDiagnostic calls from the count.
        jqUnit.expect(2);
        var webMidiMock = youme.tests.webMidiMock();

        await webMidiMock.requestMIDIAccess({ sysex: true });
        var badTypeSpecs = {
            missingTypeSpec: { id: "addOutput", name: "added output"},
            missingIdInput: { type: "input"},
            missingIdOutput: { type: "output"}
        };

        fluid.each(badTypeSpecs, function (badTypeSpec) {
            var explodingFunction = function () { webMidiMock.addPort(badTypeSpec); };
            jqUnit.expectFrameworkDiagnostic("Adding a bad port definition should result in an error.", explodingFunction, ["Attempted to add invalid port"]);
        });

        jqUnit.assertEquals("There should be no new inputs.", 0, webMidiMock.inputs.size);
        jqUnit.assertEquals("There should be no new outputs.", 0, webMidiMock.outputs.size);
    });

    jqUnit.test("We should be able to open a port directly.", async function () {
        jqUnit.expect(4);
        var inputSpec = { type: "input", id: "toOpen", name: "sample input"};
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toOpen: inputSpec
            }
        });

        var access = await  webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toOpen");
        jqUnit.assertEquals("There should be no calls in the port's register.", 0, inputPort.calls.open.length);


        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        await inputPort.open();
        jqUnit.assertEquals("The port should now be open.", "open", inputPort.connection);
        jqUnit.assertDeepEq("Our call should have been added to the port's register.", [[]], inputPort.calls.open);
    });

    jqUnit.test("We should be able to open a port via the parent component.", async function () {
        jqUnit.expect(4);
        var inputSpec = { type: "input", id: "toOpen", name: "sample input"};
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toOpen: inputSpec
            }
        });

        var access = await  webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toOpen");
        jqUnit.assertEquals("There should be no calls in the port's register.", 0, inputPort.calls.open.length);

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        webMidiMock.openPort(inputSpec);
        jqUnit.assertEquals("The port should now be open.", "open", inputPort.connection);
        jqUnit.assertDeepEq("Our call should have been added to the port's register.", [], inputPort.calls.open);
    });

    jqUnit.test("Opening a port should result in a state change event.", async function () {
        jqUnit.expect(2);
        var inputSpec = { type: "input", id: "toOpen", name: "sample input"};
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toOpen: inputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toOpen");

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        access.onstatechange = function () {
            jqUnit.start();
            jqUnit.assertEquals("The port should now be open.", "open", inputPort.connection);
        };

        jqUnit.stop();
        webMidiMock.openPort(inputSpec);
    });

    jqUnit.test("We should be able to close a port directly.", async function () {
        jqUnit.expect(4);
        var inputSpec = { type: "input", id: "toClose", name: "sample input", connection: "open"};
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toClose: inputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toClose");

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);
        jqUnit.assertEquals("There should be no calls in the port's register.", 0, inputPort.calls.close.length);

        await inputPort.close();

        jqUnit.assertEquals("The port should now be closed.", "closed", inputPort.connection);
        jqUnit.assertDeepEq("Our call should have been added to the port's register.", [[]], inputPort.calls.close);
    });

    jqUnit.test("We should be able to close a port via the parent component.", async function () {
        jqUnit.expect(4);
        var outputSpec = { type: "output", id: "toClose", name: "sample output", connection: "open"};
        var webMidiMock = youme.tests.webMidiMock({
            outputSpecs: {
                toClose: outputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var outputPort = access.outputs.get("toClose");

        // Before any changes.
        jqUnit.assertLeftHand("The output port mock should be part of the access object.", outputSpec, outputPort);
        jqUnit.assertEquals("There should be no calls in the port's register.", 0, outputPort.calls.close.length);

        webMidiMock.closePort(outputSpec);
        jqUnit.assertEquals("The port should now be closed.", "closed", outputPort.connection);
        jqUnit.assertDeepEq("Our call should have been added to the port's register.", [], outputPort.calls.close);
    });

    jqUnit.test("Closing a port should result in a state change event.", async function () {
        jqUnit.expect(2);
        var inputSpec = { type: "input", id: "toClose", name: "sample input", connection: "open"};
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toClose: inputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();

        var inputPort = access.inputs.get("toClose");

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        access.onstatechange = function () {
            jqUnit.start();
            jqUnit.assertEquals("The port should now be closed.", "closed", inputPort.connection);
        };

        jqUnit.stop();
        webMidiMock.closePort(inputSpec);
    });

    jqUnit.test("We should be able to connect a port via the parent component.", async function () {
        jqUnit.expect(2);
        var inputSpec = { type: "input", id: "toClose", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toConnect: inputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toClose");

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        webMidiMock.connectPort(inputSpec);
        jqUnit.assertEquals("The port should now be connected.", "connected", inputPort.state);
    });

    jqUnit.test("Connecting a port should result in a state change event.", async function () {
        jqUnit.expect(2);
        var inputSpec = { type: "input", id: "toConnect", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toConnect: inputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toConnect");

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        access.onstatechange = function () {
            jqUnit.start();
            jqUnit.assertEquals("The port should now be connected.", "connected", inputPort.state);
        };

        jqUnit.stop();
        webMidiMock.connectPort(inputSpec);
    });

    jqUnit.test("We should be able to disconnect a port via the parent component.", async function () {
        jqUnit.expect(2);
        var inputSpec = { type: "input", id: "toClose", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toConnect: inputSpec
            }
        });

        var access =  await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toClose");

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        webMidiMock.connectPort(inputSpec);
        jqUnit.assertEquals("The port should now be connected.", "connected", inputPort.state);
    });

    jqUnit.test("Disconnecting a port should result in a state change event.", async function () {
        jqUnit.expect(2);
        var inputSpec = { type: "input", id: "toConnect", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toConnect: inputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toConnect");

        // Before any changes.
        jqUnit.assertLeftHand("The input port mock should be part of the access object.", inputSpec, inputPort);

        access.onstatechange = function () {
            jqUnit.start();
            jqUnit.assertEquals("The port should now be connected.", "connected", inputPort.state);
        };

        jqUnit.stop();
        webMidiMock.connectPort(inputSpec);
    });

    jqUnit.test("Attempting an update with an invalid port definitions should result in an error.", function () {
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toOpen: { type: "input", id: "toOpen", name: "sample input"}
            }
        });

        var badPortSpecs = {
            missingId: { type: "input"},
            missingType: { id: "toOpen"},
            empty: {}
        };

        fluid.each(badPortSpecs, function (badPortSpec) {
            var explodingFunction = function () { webMidiMock.openPort(badPortSpec); };
            jqUnit.expectFrameworkDiagnostic("A bad port definition should cause a component updating function to throw an error.", explodingFunction, ["Attempted to update invalid port"]);
        });
    });

    jqUnit.test("We should be able to add a listener for midimessage events.", async function () {
        jqUnit.expect(1);
        var inputSpec = { type: "input", id: "toReceive", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toReceive: inputSpec
            }
        });

        var access =  await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toReceive");

        inputPort.addEventListener("midimessage", function () {
            jqUnit.start();
            jqUnit.assert("We should have been notified of a message.");
        });

        jqUnit.stop();

        inputPort.dispatchEvent(new Event("midimessage", {}));
    });

    jqUnit.test("We should be able to add a callback to receive midimessage events.", async function () {
        jqUnit.expect(1);
        var inputSpec = { type: "input", id: "toReceive", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                toReceive: inputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var inputPort = access.inputs.get("toReceive");

        inputPort.onmidimessage = function () {
            jqUnit.start();
            jqUnit.assert("We should have been notified of a message.");
        };

        jqUnit.stop();

        inputPort.dispatchEvent(new Event("midimessage", {}));
    });

    jqUnit.test("We should be able to call an output port's send method.", async function () {
        jqUnit.expect(1);
        var outputSpec = { type: "output", id: "toSend", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            outputSpecs: {
                toSend: outputSpec
            }
        });

        var access =  await webMidiMock.requestMIDIAccess();
        var outputPort = access.outputs.get("toSend");
        outputPort.send();
        jqUnit.assertDeepEq("Our arguments should have been stored in the call register.", [], outputPort.calls.send[0]);
    });

    jqUnit.test("We should be able to call an output port's clear method.", async function () {
        jqUnit.expect(1);
        var outputSpec = { type: "output", id: "toClear", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            outputSpecs: {
                toClear: outputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var outputPort = access.outputs.get("toClear");
        outputPort.clear();
        jqUnit.assertDeepEq("Our arguments should have been stored in the call register.", [], outputPort.calls.clear[0]);
    });

    jqUnit.test("The call registry should record repeated events.", async function () {
        jqUnit.expect(1);
        var outputSpec = { type: "output", id: "toClear", name: "sample input" };
        var webMidiMock = youme.tests.webMidiMock({
            outputSpecs: {
                toClear: outputSpec
            }
        });

        var access = await webMidiMock.requestMIDIAccess();
        var outputPort = access.outputs.get("toClear");
        outputPort.clear();
        outputPort.clear();
        jqUnit.assertDeepEq("The call registry should have two entries.", 2, outputPort.calls.clear.length);
    });
})(fluid, jqUnit);
