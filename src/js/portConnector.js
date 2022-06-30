/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.portConnector", {
        gradeNames: ["fluid.modelComponent"],

        events: {
            onPortOpen: null
        },

        model: {
            open: true,
            portSpec: {},
            connectionPort: null
        },

        components: {
            midiSystem: {
                type: "youme.system"
            }
        },
        dynamicComponents: {
            connection: {
                source: "{that}.model.connectionPort",
                type: "youme.connection",
                options: {
                    model: {
                        port: "{source}",
                        open: "{youme.portConnector}.model.open"
                    },
                    listeners: {
                        "onPortOpen.notifyParent": {
                            func: "{youme.portConnector}.events.onPortOpen.fire"
                        }
                    }
                }
            }
        },
        modelListeners: {
            "ports": {
                excludeSource: "init",
                funcName: "youme.portConnector.findPort",
                args: ["{that}"]
            },
            "portSpec": {
                excludeSource: "init",
                funcName: "youme.portConnector.findPort",
                args: ["{that}"]
            }
        }
    });

    youme.portConnector.findPort = function (that) {
        var connectionPort = false;
        if (that.model.portSpec) {
            var portsToSearch = fluid.makeArray(fluid.get(that, ["model", "ports"]));
            if (portsToSearch.length === 0) {
                fluid.log(fluid.logLevel.WARN, "Model has no ports to search.");
            }
            else {
                var ports = youme.findPorts(portsToSearch, that.model.portSpec);

                if (ports.length === 0) {
                    fluid.log(fluid.logLevel.WARN, "No matching ports were found for port specification: ", JSON.stringify(that.options.portSpec));
                }
                else if (ports.length === 1) {
                    connectionPort = ports[0];
                }
                else if (ports.length > 1) {
                    fluid.log(fluid.logLevel.WARN, "More than one port found for port specification: ", JSON.stringify(that.options.portSpec));
                }
            }
        }

        that.applier.change("connectionPort", connectionPort);
    };

    fluid.defaults("youme.portConnector.input", {
        gradeNames: ["youme.portConnector", "youme.messageReceiver"],

        model: {
            ports: "{youme.system}.model.ports.inputs"
        },

        dynamicComponents: {
            connection: {
                type: "youme.connection.input",
                options: {
                    listeners: {
                        "onActiveSense.relay": "{youme.portConnector}.events.onActiveSense.fire",
                        "onAftertouch.relay": "{youme.portConnector}.events.onAftertouch.fire",
                        "onClock.relay": "{youme.portConnector}.events.onClock.fire",
                        "onContinue.relay": "{youme.portConnector}.events.onContinue.fire",
                        "onControl.relay": "{youme.portConnector}.events.onControl.fire",
                        "onMessage.relay": "{youme.portConnector}.events.onMessage.fire",
                        "onNoteOff.relay": "{youme.portConnector}.events.onNoteOff.fire",
                        "onNoteOn.relay": "{youme.portConnector}.events.onNoteOn.fire",
                        "onPitchbend.relay": "{youme.portConnector}.events.onPitchbend.fire",
                        "onProgram.relay": "{youme.portConnector}.events.onProgram.fire",
                        "onRaw.relay": "{youme.portConnector}.events.onRaw.fire",
                        "onReset.relay": "{youme.portConnector}.events.onReset.fire",
                        "onSongPointer.relay": "{youme.portConnector}.events.onSongPointer.fire",
                        "onSongSelect.relay": "{youme.portConnector}.events.onSongSelect.fire",
                        "onStart.relay": "{youme.portConnector}.events.onStart.fire",
                        "onStop.relay": "{youme.portConnector}.events.onStop.fire",
                        "onSysex.relay": "{youme.portConnector}.events.onSysex.fire",
                        "onTuneRequest.relay": "{youme.portConnector}.events.onTuneRequest.fire"
                    }
                }
            }
        }
    });

    fluid.defaults("youme.portConnector.output", {
        gradeNames: ["youme.portConnector", "youme.messageSender"],

        model: {
            ports: "{youme.system}.model.ports.outputs"
        },

        dynamicComponents: {
            connection: {
                type: "youme.connection.output",
                options: {
                    events: {
                        sendActiveSense: "{youme.portConnector}.events.sendActiveSense",
                        sendAftertouch: "{youme.portConnector}.events.sendAftertouch",
                        sendClock: "{youme.portConnector}.events.sendClock",
                        sendContinue: "{youme.portConnector}.events.sendContinue",
                        sendControl: "{youme.portConnector}.events.sendControl",
                        sendMessage: "{youme.portConnector}.events.sendMessage",
                        sendNoteOff: "{youme.portConnector}.events.sendNoteOff",
                        sendNoteOn: "{youme.portConnector}.events.sendNoteOn",
                        sendPitchbend: "{youme.portConnector}.events.sendPitchbend",
                        sendProgram: "{youme.portConnector}.events.sendProgram",
                        sendRaw: "{youme.portConnector}.events.sendRaw",
                        sendReset: "{youme.portConnector}.events.sendReset",
                        sendSongPointer: "{youme.portConnector}.events.sendSongPointer",
                        sendSongSelect: "{youme.portConnector}.events.sendSongSelect",
                        sendStart: "{youme.portConnector}.events.sendStart",
                        sendStop: "{youme.portConnector}.events.sendStop",
                        sendSysex: "{youme.portConnector}.events.sendSysex",
                        sendTuneRequest: "{youme.portConnector}.events.sendTuneRequest"
                    }
                }
            }
        }
    });
})(fluid);
