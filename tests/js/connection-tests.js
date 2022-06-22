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

    fluid.registerNamespace("youme.test.connection");

    jqUnit.module("Connection component tests.");

    youme.test.connection.portDefaults = {
        type: "output",
        connection: "closed",
        state: "disconnected"
    };

    youme.test.connection.generateSafePort = function () {
        return youme.tests.webMidiMock.generateMockPort(
            youme.test.connection.portDefaults,
            { name: "safe port" }
        );
    };

    youme.test.connection.generateExplodingPort = function () {
        return youme.tests.webMidiMock.generateMockPort(
            youme.test.connection.portDefaults,
            { name: "exploding port" },
            true
        );
    };


    jqUnit.test("We should be able to open a connection manually.", function () {
        var port = youme.test.connection.generateSafePort();

        var onPortOpenListener = function () {
            jqUnit.start();
            jqUnit.assertEquals("The port should be open after calling the open invoker.", port.connection, "open");
        };

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.fail("There should not have been an error opening the connection.");
        };

        var connection = youme.connection({
            openImmediately: false,
            members: {
                port: port
            },
            listeners: {
                "onPortOpen.runAssertion": {
                    priority: "after:startListening",
                    func: onPortOpenListener
                },
                "onError.fail": {
                    func: onErrorListener
                }
            }
        });

        jqUnit.assertEquals("The port should not be open on startup.", port.connection, "closed");

        jqUnit.stop();
        connection.open();
    });


    jqUnit.test("We should be able to open a connection automatically.", function () {
        var port = youme.test.connection.generateSafePort();

        jqUnit.stop();

        var onPortOpenListener = function () {
            jqUnit.start();
            jqUnit.assertEquals("The port should be opened on startup.", port.connection, "open");
        };

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.fail("There should not have been an error opening the connection.");
        };

        youme.connection({
            openImmediately: true,
            members: {
                port: port
            },
            listeners: {
                onPortOpen: {
                    func: onPortOpenListener
                },
                onError: {
                    func: onErrorListener
                }
            }
        });
    });

    jqUnit.test("We should be able to handle an attempt to open a missing port.", function () {
        jqUnit.stop();

        var onPortOpenListener = function () {
            jqUnit.start();
            jqUnit.fail("The port should not have be opened.");
        };

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.assert("There should have been an error opening the connection.");
        };

        youme.connection({
            openImmediately: true,
            members: {
                port: false
            },
            listeners: {
                onPortOpen: {
                    func: onPortOpenListener
                },
                onError: {
                    func: onErrorListener
                }
            }
        });
    });

    jqUnit.test("We should be able to handle an error when opening a port.", function () {
        var explodingPort = youme.test.connection.generateExplodingPort();

        jqUnit.stop();

        var onPortOpenListener = function () {
            jqUnit.start();
            jqUnit.fail("The port should not have be opened.");
        };

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.assert("There should have been an error opening the connection.");
        };

        youme.connection({
            openImmediately: true,
            members: {
                port: explodingPort
            },
            listeners: {
                onPortOpen: {
                    func: onPortOpenListener
                },
                onError: {
                    func: onErrorListener
                }
            }
        });
    });

    jqUnit.test("We should be able to close a connection.", function () {
        var port = youme.test.connection.generateSafePort();
        var connection = youme.connection({
            openImmediately: true,
            members: {
                port: port
            }
        });

        jqUnit.assertEquals("The port be open on startup.", port.connection, "open");

        connection.events.onPortClose.addListener(function () {
            jqUnit.start();
            jqUnit.assertEquals("The port should be closed after calling the close invoker.", port.connection, "closed");
        });

        connection.events.onError.addListener(function () {
            jqUnit.start();
            jqUnit.fail("There should not have been an error opening the connection.");
        });

        jqUnit.stop();
        connection.close();
    });


    jqUnit.test("We should be able to handle an attempt to close a missing port.", function () {
        var onPortCloseListener = function () {
            jqUnit.start();
            jqUnit.fail("The port should not have be closed.");
        };

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.assert("There should have been an error closing the connection.");
        };

        var connection = youme.connection({
            // Don't let it auto open or that will prematurely trigger an onError event.
            openImmediately: false,
            members: {
                port: false
            },
            listeners: {
                onPortClose: {
                    func: onPortCloseListener
                },
                onError: {
                    func: onErrorListener
                }
            }
        });

        jqUnit.stop();
        connection.close();
    });

    jqUnit.test("We should be able to handle an error when closing a port.", function () {
        var explodingPort = youme.test.connection.generateExplodingPort();

        var onPortCloseListener = function () {
            jqUnit.start();
            jqUnit.fail("The port should not have be closed.");
        };

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.assert("There should have been an error closing the connection.");
        };

        var connection = youme.connection({
            // Don't let it auto open or that will prematurely trigger an onError event.
            openImmediately: false,
            members: {
                port: explodingPort
            },
            listeners: {
                onPortClose: {
                    func: onPortCloseListener
                },
                onError: {
                    func: onErrorListener
                }
            }
        });

        jqUnit.stop();
        connection.close();
    });

    jqUnit.test("We should be able to receive a message from an input.", function () {
        var port = youme.test.connection.generateSafePort();

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};
        var onMessageListener = function (receivedMessage) {
            jqUnit.start();
            jqUnit.assert("We should have received a message from the port.");
            jqUnit.assertDeepEq("The message should be as expected.", sampleMessage, receivedMessage);
        };

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.fail("There should not have been an error opening the connection.");
        };

        var onPortOpenListener = function () {
            var midiEvent = new Event("midimessage");
            midiEvent.data = youme.write(sampleMessage);

            port.dispatchEvent(midiEvent);
        };

        jqUnit.stop();

        youme.connection.input({
            openImmediately: true,
            members: {
                port: port
            },
            listeners: {
                onMessage: {
                    func: onMessageListener
                },
                onError: {
                    func: onErrorListener
                },
                "onPortOpen.triggerMessage": {
                    priority: "after:startListening",
                    func: onPortOpenListener
                }
            }
        });
    });


    jqUnit.test("We should be able to send a message to an output.", function () {
        var port = youme.test.connection.generateSafePort();

        var sampleMessage = { type: "noteOn", channel: 0, velocity: 88, note: 89};

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.fail("There should not have been an error opening the connection.");
        };

        var connection = youme.connection.output({
            openImmediately: true,
            members: {
                port: port
            },
            listeners: {
                onError: {
                    func: onErrorListener
                }
            }
        });

        connection.events.sendNoteOn.fire(sampleMessage);
        jqUnit.assertEquals("Our send method should have been called once.", 1, port.calls.send.length);
        jqUnit.assertDeepEq("The message should have been encoded properly.", youme.write(sampleMessage), port.calls.send[0][0]);
    });


    jqUnit.test("We should be able to handle an attempt to send to a missing output.", function () {
        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.assert("There should have been an error sending the message.");
        };

        var connection = youme.connection.output({
            // Don't let it auto open or that will prematurely trigger an onError event.
            openImmediately: false,
            members: {
                port: false
            },
            listeners: {
                onError: {
                    func: onErrorListener
                }
            }
        });

        jqUnit.stop();
        connection.events.sendMessage.fire({ type: "noteOff", channel: 0, note: 1, velocity: 2});
    });

    jqUnit.test("'Typed' message events should not send incorrect message types.", function () {
        var port = youme.test.connection.generateSafePort();

        var sampleMessage = { type: "control", channel: 0, value: 88, number: 89};

        var onErrorListener = function () {
            jqUnit.start();
            jqUnit.fail("There should not have been an error opening the connection.");
        };

        var connection = youme.connection.output({
            openImmediately: true,
            members: {
                port: port
            },
            listeners: {
                onError: {
                    func: onErrorListener
                }
            }
        });

        connection.events.sendNoteOn.fire(sampleMessage);
        jqUnit.assertEquals("Our send method should not have been called.", 0, port.calls.send.length);
    });
})(fluid);
