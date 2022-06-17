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
            attemptConnection: null,
            onPortOpen: null
        },

        model: {
            portSpec: {}
        },

        invokers: {
            open: {
                funcName: "youme.portConnector.callAllChildInvokers",
                args: ["{that}", "open"] // that, invokerName, invokerArgs
            },

            close: {
                funcName: "youme.portConnector.callAllChildInvokers",
                args: ["{that}", "close"] // that, invokerName, invokerArgs
            }
        },

        components: {
            midiSystem: {
                type: "youme.system"
            },
            connection: {
                createOnEvent: "attemptConnection",
                type: "youme.connection",
                options: {
                    openImmediately: true,
                    portSpec: "{youme.portConnector}.model.portSpec",
                    members: {
                        port: "{arguments}.0"
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
                funcName: "youme.portConnector.attemptConnection",
                args: ["{that}"]
            },
            "portSpec": {
                excludeSource: "init",
                funcName: "youme.portConnector.attemptConnection",
                args: ["{that}"]
            }
        }
    });

    youme.portConnector.attemptConnection = function (that) {
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
                    // Lightly update the portSpec to reflect the ID, so that select boxes can detect that we have found it.
                    that.applier.change("portSpec.id", ports[0].id);
                    that.events.attemptConnection.fire(ports[0]);
                }
                else if (ports.length > 1) {
                    fluid.log(fluid.logLevel.WARN, "More than one port found for port specification: ", JSON.stringify(that.options.portSpec));
                }
            }
        }
        else {
            youme.portConnector.callAllChildInvokers(that, "destroy");
        }
    };

    // TODO: If we use this pattern much more widely, make the grade name a variable and move this somewhere more central.
    youme.portConnector.callAllChildInvokers = function (that, invokerName, invokerArgs) {
        // This catches some, but not all cases in which the shadow layer doesn't exist, but "it's fine" (for now).
        if (!fluid.isDestroyed(that)) {
            fluid.visitComponentChildren(that, function (childComponent) {
                if (fluid.componentHasGrade(childComponent, "youme.connection")) {
                    childComponent[invokerName].apply(childComponent, fluid.makeArray(invokerArgs));
                }
            }, {}); // Empty options are required to avoid an error.
        }
    };

    fluid.defaults("youme.portConnector.input", {
        gradeNames: ["youme.portConnector", "youme.messageReceiver"],

        model: {
            ports: "{youme.system}.model.ports.inputs"
        },

        components: {
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

        components: {
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
