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

    jqUnit.module("Input port connector tests");

    jqUnit.test("We should be able to connect to an input by changing the selected port ID.", function () {
        var webMidiMock = youme.tests.webMidiMock({
            inputSpecs: {
                firstInput: { type: "input", id: "input1", name: "sample input 1"},
                secondInput: { type: "input", id: "input2", name: "sample input 2"}
            }
        });
        var component = youme.connection.input();
        // TODO: Change the selected port ID.
        // TODO: Simulate a message from the input.
        // TODO: Confirm that it was received.
        // TODO: Change the port ID again.
        // TODO: Simulate a message to the first input, nothing should be received.
        // TODO: Simulate a message to the second input, something should be received.
    });

    // TODO: Confirm that a portSpec that matches an existing port can connect on startup.

    // TODO: Confirm that no connection is made when there is no matching port.

    // TODO: Confirm that a portSpec that matches two ports does not make a connection.

    // TODO: Confirm that a message is relayed from a wrapped input port to the port connector.

    // TODO: Confirm that the connection is created when a matching port is added.

    // TODO: Confirm that the connection is destroyed when the associated port is removed.

    jqUnit.module("Output port connector tests");

    // TODO: Confirm that a portSpec that matches an existing port can connect on startup.

    // TODO: Confirm that no connection is made when there is no matching port.

    // TODO: Confirm that a portSpec that matches two ports does not make a connection.

    // TODO: Confirm that a message is relayed from the port connector to its output port.

    // TODO: Confirm that the connection is created when a matching port is added.

    // TODO: Confirm that the connection is destroyed when the associated port is removed.

})(fluid);
