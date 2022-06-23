/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    // Enclosing grade so that we can recreate our pool of connections.
    fluid.defaults("youme.multiPortConnector", {
        gradeNames: ["fluid.modelComponent"],

        direction: "inputs",

        model: {
            connectionPorts: [],
            ports: "{youme.system}.model.ports"

        },

        invokers: {
            open: {
                funcName: "youme.multiPortConnector.callAllChildInvokers",
                args: ["{that}", "youme.connection", "open"] // that, gradeName, invokerName, invokerArgs
            },

            close: {
                funcName: "youme.multiPortConnector.callAllChildInvokers",
                args: ["{that}", "youme.connection", "close"] // that, gradeName, invokerName, invokerArgs
            }
        },

        components: {
            midiSystem: {
                type: "youme.system"
            }
        },

        dynamicComponents: {
            connection: {
                type: "youme.connection",
                sources: "{youme.multiPortConnector}.model.connectionPorts",
                options: {
                    model: {
                        port: "{source}"
                    }
                }
            }
        },

        modelListeners: {
            "ports": {
                excludeSource: "init",
                funcName: "youme.multiPortConnector.findPorts",
                args: ["{that}", "{that}.options.direction"] // direction
            },
            "portSpecs": {
                excludeSource: "init",
                funcName: "youme.multiPortConnector.findPorts",
                args: ["{that}", "{that}.options.direction"] // direction
            }
        }
    });

    youme.multiPortConnector.findPorts = function (that, direction) {
        // Create it as a map indexed by ID so that we can avoid duplicates.
        var connectionPortsById = {};
        fluid.each(that.model.portSpecs, function (portSpec) {
            var portsToSearch = fluid.makeArray(fluid.get(that, ["model", "ports", direction]));
            if (portsToSearch.length > 0) {
                var ports = youme.findPorts(portsToSearch, portSpec);
                fluid.each(ports, function (port) {
                    connectionPortsById[port.id] = port;
                });
            }
        });
        var connectionPorts = Object.values(connectionPortsById);

        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: "connectionPorts", type: "DELETE" });
        transaction.fireChangeRequest({ path: "connectionPorts", value: connectionPorts});
        transaction.commit();
    };

    youme.multiPortConnector.callAllChildInvokers = function (that, gradeName, invokerPath, invokerArgs) {
        var childrenToInvoke = [];

        // This catches some, but not all cases in which the shadow layer doesn't exist, but "it's fine" (for now).
        if (!fluid.isDestroyed(that)) {
            // We have to collect the list first rather than destroying each as we find them, otherwise things break down.
            fluid.visitComponentChildren(that, function (childComponent) {
                if (fluid.componentHasGrade(childComponent, gradeName)) {
                    childrenToInvoke.push(childComponent);
                }
            }, {}); // Empty options are required to avoid an error.

            fluid.each(childrenToInvoke, function (childComponent) {
                var invoker = fluid.get(childComponent, invokerPath);
                if (typeof invoker === "function") {
                    invoker.apply(childComponent, fluid.makeArray(invokerArgs));
                }
            });
        }
    };

    fluid.defaults("youme.multiPortConnector.inputs", {
        gradeNames: ["youme.multiPortConnector", "youme.messageReceiver"],

        // youme.multiPortConnector.callAllChildInvokers = function (that, gradeName, invokerName, invokerArgs)
        dynamicComponents: {
            connection: {
                type: "youme.connection.input",
                options: {
                    listeners: {
                        "onActiveSense.relay": "{youme.multiPortConnector.inputs}.events.onActiveSense.fire",
                        "onAftertouch.relay": "{youme.multiPortConnector.inputs}.events.onAftertouch.fire",
                        "onClock.relay": "{youme.multiPortConnector.inputs}.events.onClock.fire",
                        "onContinue.relay": "{youme.multiPortConnector.inputs}.events.onContinue.fire",
                        "onControl.relay": "{youme.multiPortConnector.inputs}.events.onControl.fire",
                        "onMessage.relay": "{youme.multiPortConnector.inputs}.events.onMessage.fire",
                        "onNoteOff.relay": "{youme.multiPortConnector.inputs}.events.onNoteOff.fire",
                        "onNoteOn.relay": "{youme.multiPortConnector.inputs}.events.onNoteOn.fire",
                        "onPitchbend.relay": "{youme.multiPortConnector.inputs}.events.onPitchbend.fire",
                        "onProgram.relay": "{youme.multiPortConnector.inputs}.events.onProgram.fire",
                        "onRaw.relay": "{youme.multiPortConnector.inputs}.events.onRaw.fire",
                        "onReset.relay": "{youme.multiPortConnector.inputs}.events.onReset.fire",
                        "onSongPointer.relay": "{youme.multiPortConnector.inputs}.events.onSongPointer.fire",
                        "onSongSelect.relay": "{youme.multiPortConnector.inputs}.events.onSongSelect.fire",
                        "onStart.relay": "{youme.multiPortConnector.inputs}.events.onStart.fire",
                        "onStop.relay": "{youme.multiPortConnector.inputs}.events.onStop.fire",
                        "onSysex.relay": "{youme.multiPortConnector.inputs}.events.onSysex.fire",
                        "onTuneRequest.relay": "{youme.multiPortConnector.inputs}.events.onTuneRequest.fire"
                    }
                }
            }
        }
    });

    fluid.defaults("youme.multiPortConnector.outputs", {
        gradeNames: ["youme.multiPortConnector", "youme.messageSender"],

        direction: "outputs",


        invokers: {
            relayEvent: {
                funcName: "youme.multiPortConnector.outputs.relayEvent",
                args: ["{that}", "{arguments}.0", "{arguments}.1"] // eventName, payload
            }
        },

        dynamicComponents: {
            connection: {
                type: "youme.connection.output",
                options: {
                    // We couldn't use this pattern for multiple ports because it seems like only one port ends up
                    // being able to receive events.
                    // events: {
                    //     sendActiveSense: "{youme.multiPortConnector.outputs}.events.sendActiveSense",
                    //     sendAftertouch: "{youme.multiPortConnector.outputs}.events.sendAftertouch",
                    //     sendClock: "{youme.multiPortConnector.outputs}.events.sendClock",
                    //     sendContinue: "{youme.multiPortConnector.outputs}.events.sendContinue",
                    //     sendControl: "{youme.multiPortConnector.outputs}.events.sendControl",
                    //     sendMessage: "{youme.multiPortConnector.outputs}.events.sendMessage",
                    //     sendNoteOff: "{youme.multiPortConnector.outputs}.events.sendNoteOff",
                    //     sendNoteOn: "{youme.multiPortConnector.outputs}.events.sendNoteOn",
                    //     sendPitchbend: "{youme.multiPortConnector.outputs}.events.sendPitchbend",
                    //     sendProgram: "{youme.multiPortConnector.outputs}.events.sendProgram",
                    //     sendRaw: "{youme.multiPortConnector.outputs}.events.sendRaw",
                    //     sendReset: "{youme.multiPortConnector.outputs}.events.sendReset",
                    //     sendSongPointer: "{youme.multiPortConnector.outputs}.events.sendSongPointer",
                    //     sendSongSelect: "{youme.multiPortConnector.outputs}.events.sendSongSelect",
                    //     sendStart: "{youme.multiPortConnector.outputs}.events.sendStart",
                    //     sendStop: "{youme.multiPortConnector.outputs}.events.sendStop",
                    //     sendSysex: "{youme.multiPortConnector.outputs}.events.sendSysex",
                    //     sendTuneRequest: "{youme.multiPortConnector.outputs}.events.sendTuneRequest"
                    // }
                }
            }
        },

        listeners: {
            sendActiveSense: {
                func: "{that}.relayEvent",
                args: ["sendActiveSense", "{arguments}.0"] // eventName, payload
            },
            sendAftertouch: {
                func: "{that}.relayEvent",
                args: ["sendAftertouch", "{arguments}.0"] // eventName, payload
            },
            sendClock: {
                func: "{that}.relayEvent",
                args: ["sendClock", "{arguments}.0"] // eventName, payload
            },
            sendContinue: {
                func: "{that}.relayEvent",
                args: ["sendContinue", "{arguments}.0"] // eventName, payload
            },
            sendControl: {
                func: "{that}.relayEvent",
                args: ["sendControl", "{arguments}.0"] // eventName, payload
            },
            sendMessage: {
                func: "{that}.relayEvent",
                args: ["sendMessage", "{arguments}.0"] // eventName, payload
            },
            sendNoteOff: {
                func: "{that}.relayEvent",
                args: ["sendNoteOff", "{arguments}.0"] // eventName, payload
            },
            sendNoteOn: {
                func: "{that}.relayEvent",
                args: ["sendNoteOn", "{arguments}.0"] // eventName, payload
            },
            sendPitchbend: {
                func: "{that}.relayEvent",
                args: ["sendPitchbend", "{arguments}.0"] // eventName, payload
            },
            sendProgram: {
                func: "{that}.relayEvent",
                args: ["sendProgram", "{arguments}.0"] // eventName, payload
            },
            sendRaw: {
                func: "{that}.relayEvent",
                args: ["sendRaw", "{arguments}.0"] // eventName, payload
            },
            sendReset: {
                func: "{that}.relayEvent",
                args: ["sendReset", "{arguments}.0"] // eventName, payload
            },
            sendSongPointer: {
                func: "{that}.relayEvent",
                args: ["sendSongPointer", "{arguments}.0"] // eventName, payload
            },
            sendSongSelect: {
                func: "{that}.relayEvent",
                args: ["sendSongSelect", "{arguments}.0"] // eventName, payload
            },
            sendStart: {
                func: "{that}.relayEvent",
                args: ["sendStart", "{arguments}.0"] // eventName, payload
            },
            sendStop: {
                func: "{that}.relayEvent",
                args: ["sendStop", "{arguments}.0"] // eventName, payload
            },
            sendSysex: {
                func: "{that}.relayEvent",
                args: ["sendSysex", "{arguments}.0"] // eventName, payload
            },
            sendTuneRequest: {
                func: "{that}.relayEvent",
                args: ["sendTuneRequest", "{arguments}.0"] // eventName, payload
            }
        }
    });

    youme.multiPortConnector.outputs.relayEvent = function (that, eventName, payload) {
        var invokerName = ["events", eventName, "fire"].join(".");
        youme.multiPortConnector.callAllChildInvokers(that, "youme.connection", invokerName, [payload]);
    };
})(fluid);
