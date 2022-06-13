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
    fluid.defaults("youme.multiPortConnector.connections", {
        gradeNames: ["fluid.component"],

        invokers: {
            open: {
                funcName: "youme.multiPortConnector.callAllChildInvokers",
                args: ["{that}", "youme.connection", "open"] // that, gradeName, invokerName, invokerArgs
            },

            close: {
                funcName: "youme.multiPortConnector.callAllChildInvokers",
                args: ["{that}", "youme.connection", "close"] // that, gradeName, invokerName, invokerArgs
            }
        }
    });

    fluid.defaults("youme.multiPortConnector.connections.inputs", {
        gradeNames: ["youme.multiPortConnector.connections"],

        dynamicComponents: {
            connection : {
                type: "youme.connection.input",
                sources: "{connections}.options.sources",
                options: {
                    openImmediately: true,
                    portSpec: "{source}.portSpec",
                    members: {
                        port: "{source}.port"
                    }
                }
            }
        }
    });

    fluid.defaults("youme.multiPortConnector.connections.outputs", {
        gradeNames: ["youme.multiPortConnector.connections"],

        dynamicComponents: {
            connection : {
                type: "youme.connection.output",
                sources: "{connections}.options.sources",
                options: {
                    openImmediately: true,
                    portSpec: "{source}.portSpec",
                    members: {
                        port: "{source}.port"
                    }
                }
            }
        }
    });

    fluid.defaults("youme.multiPortConnector", {
        gradeNames: ["fluid.modelComponent"],

        events: {
            attemptConnection: null
        },

        model: {
            portSpecs: [],
            ports: "{youme.system}.model.ports"
        },

        invokers: {
            open: {
                funcName: "youme.multiPortConnector.callAllChildInvokers",
                args: ["{that}", "youme.multiPortConnector.connections", "open"] // that, gradeName, invokerName, invokerArgs
            },

            close: {
                funcName: "youme.multiPortConnector.callAllChildInvokers",
                args: ["{that}", "youme.multiPortConnector.connections", "close"] // that, gradeName, invokerName, invokerArgs
            }
        },

        components: {
            midiSystem: {
                type: "youme.system"
            }
        },
        modelListeners: {
            "ports": {
                excludeSource: "init",
                funcName: "youme.multiPortConnector.attemptConnection",
                args: ["{that}", "inputs"] // direction
            },
            "portSpecs": {
                excludeSource: "init",
                funcName: "youme.multiPortConnector.attemptConnection",
                args: ["{that}", "inputs"] // direction
            }
        }
    });

    youme.multiPortConnector.attemptConnection = function (that, direction) {
        var connectionSources = [];
        fluid.each(that.model.portSpecs, function (portSpec) {
            var portsToSearch = fluid.makeArray(fluid.get(that, ["model", "ports", direction]));
            if (portsToSearch.length > 0) {
                var ports = youme.findPorts(portsToSearch, portSpec);
                fluid.each(ports, function (port) {
                    connectionSources.push({
                        portSpec: portSpec,
                        port: port
                    });
                });
            }
        });

        youme.multiPortConnector.callAllChildInvokers(that, "youme.multiPortConnector.connections", "destroy");
        that.events.attemptConnection.fire(connectionSources);
    };

    youme.multiPortConnector.callAllChildInvokers = function (that, gradeName, invokerName, invokerArgs) {
        var childrenToInvoke = [];
        // We have to collect the list first rather than destroying each as we find them, otherwise things break down.
        fluid.visitComponentChildren(that, function (childComponent) {
            if (fluid.componentHasGrade(childComponent, gradeName)) {
                childrenToInvoke.push(childComponent);
            }
        }, {}); // Empty options are required to avoid an error.

        fluid.each(childrenToInvoke, function (childComponent) {
            childComponent[invokerName].apply(childComponent, fluid.makeArray(invokerArgs));
        });
    };

    fluid.defaults("youme.multiPortConnector.inputs", {
        gradeNames: ["youme.multiPortConnector", "youme.messageReceiver"],

        dynamicComponents: {
            // This type of nesting is required because we can't use both createOnEvent and sources for a single dynamic
            // component definition.
            connections: {
                createOnEvent: "attemptConnection",
                type: "youme.multiPortConnector.connections.inputs",
                options: {
                    sources: "{arguments}.0",
                    dynamicComponents: {
                        connection : {
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
                }
            }
        }
    });

    fluid.defaults("youme.multiPortConnector.outputs", {
        gradeNames: ["youme.multiPortConnector", "youme.messageSender"],

        dynamicComponents: {
            // This type of nesting is required because we can't use both createOnEvent and sources for a single dynamic
            // component definition.
            connections: {
                createOnEvent: "attemptConnection",
                type: "youme.multiPortConnector.connections.outputs",
                options: {
                    sources: "{arguments}.0",
                    dynamicComponents: {
                        connection : {
                            options: {
                                events: {
                                    sendActiveSense: "{youme.multiPortConnector.outputs}.events.sendActiveSense",
                                    sendAftertouch: "{youme.multiPortConnector.outputs}.events.sendAftertouch",
                                    sendClock: "{youme.multiPortConnector.outputs}.events.sendClock",
                                    sendContinue: "{youme.multiPortConnector.outputs}.events.sendContinue",
                                    sendControl: "{youme.multiPortConnector.outputs}.events.sendControl",
                                    sendMessage: "{youme.multiPortConnector.outputs}.events.sendMessage",
                                    sendNoteOff: "{youme.multiPortConnector.outputs}.events.sendNoteOff",
                                    sendNoteOn: "{youme.multiPortConnector.outputs}.events.sendNoteOn",
                                    sendPitchbend: "{youme.multiPortConnector.outputs}.events.sendPitchbend",
                                    sendProgram: "{youme.multiPortConnector.outputs}.events.sendProgram",
                                    sendRaw: "{youme.multiPortConnector.outputs}.events.sendRaw",
                                    sendReset: "{youme.multiPortConnector.outputs}.events.sendReset",
                                    sendSongPointer: "{youme.multiPortConnector.outputs}.events.sendSongPointer",
                                    sendSongSelect: "{youme.multiPortConnector.outputs}.events.sendSongSelect",
                                    sendStart: "{youme.multiPortConnector.outputs}.events.sendStart",
                                    sendStop: "{youme.multiPortConnector.outputs}.events.sendStop",
                                    sendSysex: "{youme.multiPortConnector.outputs}.events.sendSysex",
                                    sendTuneRequest: "{youme.multiPortConnector.outputs}.events.sendTuneRequest"
                                }
                            }
                        }
                    }
                }
            }
        },

        modelListeners: {
            "ports": {
                excludeSource: "init",
                funcName: "youme.multiPortConnector.attemptConnection",
                args: ["{that}", "outputs"] // direction
            },
            "portSpecs": {
                excludeSource: "init",
                funcName: "youme.multiPortConnector.attemptConnection",
                args: ["{that}", "outputs"] // direction
            }
        }
    });
})(fluid);
