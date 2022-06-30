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
            portSpecs: [],
            ports: "{youme.system}.model.ports",
            open: true
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
                        port: "{source}",
                        open: "{youme.multiPortConnector}.model.open"
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

        fluid.replaceModelValue(that.applier, "connectionPorts", connectionPorts);
    };

    fluid.defaults("youme.multiPortConnector.inputs", {
        gradeNames: ["youme.multiPortConnector", "youme.messageReceiver"],

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

        dynamicComponents: {
            connection: {
                type: "youme.connection.output",
                options: {
                    listeners: {
                        "{youme.multiPortConnector.outputs}.events.sendActiveSense": "{that}.events.sendActiveSense.fire",
                        "{youme.multiPortConnector.outputs}.events.sendAftertouch": "{that}.events.sendAftertouch.fire",
                        "{youme.multiPortConnector.outputs}.events.sendClock": "{that}.events.sendClock.fire",
                        "{youme.multiPortConnector.outputs}.events.sendContinue": "{that}.events.sendContinue.fire",
                        "{youme.multiPortConnector.outputs}.events.sendControl": "{that}.events.sendControl.fire",
                        "{youme.multiPortConnector.outputs}.events.sendMessage": "{that}.events.sendMessage.fire",
                        "{youme.multiPortConnector.outputs}.events.sendNoteOff": "{that}.events.sendNoteOff.fire",
                        "{youme.multiPortConnector.outputs}.events.sendNoteOn": "{that}.events.sendNoteOn.fire",
                        "{youme.multiPortConnector.outputs}.events.sendPitchbend": "{that}.events.sendPitchbend.fire",
                        "{youme.multiPortConnector.outputs}.events.sendProgram": "{that}.events.sendProgram.fire",
                        "{youme.multiPortConnector.outputs}.events.sendRaw": "{that}.events.sendRaw.fire",
                        "{youme.multiPortConnector.outputs}.events.sendReset": "{that}.events.sendReset.fire",
                        "{youme.multiPortConnector.outputs}.events.sendSongPointer": "{that}.events.sendSongPointer.fire",
                        "{youme.multiPortConnector.outputs}.events.sendSongSelect": "{that}.events.sendSongSelect.fire",
                        "{youme.multiPortConnector.outputs}.events.sendStart": "{that}.events.sendStart.fire",
                        "{youme.multiPortConnector.outputs}.events.sendStop": "{that}.events.sendStop.fire",
                        "{youme.multiPortConnector.outputs}.events.sendSysex": "{that}.events.sendSysex.fire",
                        "{youme.multiPortConnector.outputs}.events.sendTuneRequest": "{that}.events.sendTuneRequest.fire"
                    }
                }
            }
        }
    });
})(fluid);
