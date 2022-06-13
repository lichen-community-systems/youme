/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    // TODO: Add support for matching based on portSpec rather than just id.
    // TODO: Add support for "none"
    // TODO: Add support for virtual ports.
    fluid.defaults("youme.portSelectorView", {
        gradeNames: ["fluid.viewComponent"],

        selectBoxLabel: "MIDI Port:",

        model: {
            portSpec: {
                id: false
            }
        },

        components: {
            system: {
                type: "youme.system"
            },
            portConnector: {
                type: "youme.portConnector",
                options: {
                    model: {
                        portSpec: "{portSelectorView}.model.portSpec"
                    }
                }
            },

            selectBox: {
                type: "youme.selectBox",
                container: "{that}.container",
                options: {
                    model: {
                        label: "{youme.portSelectorView}.options.selectBoxLabel",
                        selectedItemId: "{youme.portSelectorView}.model.portSpec.id"
                    }
                }
            }
        }
    });

    youme.portSelectorView.updatePortSpec = function (that) {
        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: "portSpec", type: "DELETE" });
        transaction.fireChangeRequest({ path: "portSpec", value: { id: that.model.selectedPortId }});
        transaction.commit();
    };

    fluid.defaults("youme.portSelectorView.input", {
        gradeNames: ["youme.portSelectorView", "youme.messageReceiver"],

        selectBoxLabel: "MIDI Input:",

        components: {
            portConnector: {
                type: "youme.portConnector.input",
                options: {
                    listeners: {
                        "onActiveSense.relay": "{youme.portSelectorView.input}.events.onActiveSense.fire",
                        "onAftertouch.relay": "{youme.portSelectorView.input}.events.onAftertouch.fire",
                        "onClock.relay": "{youme.portSelectorView.input}.events.onClock.fire",
                        "onContinue.relay": "{youme.portSelectorView.input}.events.onContinue.fire",
                        "onControl.relay": "{youme.portSelectorView.input}.events.onControl.fire",
                        "onMessage.relay": "{youme.portSelectorView.input}.events.onMessage.fire",
                        "onNoteOff.relay": "{youme.portSelectorView.input}.events.onNoteOff.fire",
                        "onNoteOn.relay": "{youme.portSelectorView.input}.events.onNoteOn.fire",
                        "onPitchbend.relay": "{youme.portSelectorView.input}.events.onPitchbend.fire",
                        "onProgram.relay": "{youme.portSelectorView.input}.events.onProgram.fire",
                        "onRaw.relay": "{youme.portSelectorView.input}.events.onRaw.fire",
                        "onReset.relay": "{youme.portSelectorView.input}.events.onReset.fire",
                        "onSongPointer.relay": "{youme.portSelectorView.input}.events.onSongPointer.fire",
                        "onSongSelect.relay": "{youme.portSelectorView.input}.events.onSongSelect.fire",
                        "onStart.relay": "{youme.portSelectorView.input}.events.onStart.fire",
                        "onStop.relay": "{youme.portSelectorView.input}.events.onStop.fire",
                        "onSysex.relay": "{youme.portSelectorView.input}.events.onSysex.fire",
                        "onTuneRequest.relay": "{youme.portSelectorView.input}.events.onTuneRequest.fire"
                    }
                }
            },

            selectBox: {
                type: "youme.selectBox",
                container: "{that}.container",
                options: {
                    model: {
                        optionItems: "{youme.system}.model.ports.inputs"
                    }
                }
            }
        }
    });

    fluid.defaults("youme.portSelectorView.output", {
        gradeNames: ["youme.portSelectorView", "youme.messageSender"],

        selectBoxLabel: "MIDI Output:",

        components: {
            portConnector: {
                type: "youme.portConnector.output",
                options: {
                    events: {
                        sendActiveSense: "{youme.portSelectorView.output}.events.sendActiveSense",
                        sendAftertouch: "{youme.portSelectorView.output}.events.sendAftertouch",
                        sendClock: "{youme.portSelectorView.output}.events.sendClock",
                        sendContinue: "{youme.portSelectorView.output}.events.sendContinue",
                        sendControl: "{youme.portSelectorView.output}.events.sendControl",
                        sendMessage: "{youme.portSelectorView.output}.events.sendMessage",
                        sendNoteOff: "{youme.portSelectorView.output}.events.sendNoteOff",
                        sendNoteOn: "{youme.portSelectorView.output}.events.sendNoteOn",
                        sendPitchbend: "{youme.portSelectorView.output}.events.sendPitchbend",
                        sendProgram: "{youme.portSelectorView.output}.events.sendProgram",
                        sendRaw: "{youme.portSelectorView.output}.events.sendRaw",
                        sendReset: "{youme.portSelectorView.output}.events.sendReset",
                        sendSongPointer: "{youme.portSelectorView.output}.events.sendSongPointer",
                        sendSongSelect: "{youme.portSelectorView.output}.events.sendSongSelect",
                        sendStart: "{youme.portSelectorView.output}.events.sendStart",
                        sendStop: "{youme.portSelectorView.output}.events.sendStop",
                        sendSysex: "{youme.portSelectorView.output}.events.sendSysex",
                        sendTuneRequest: "{youme.portSelectorView.output}.events.sendTuneRequest"
                    }
                }
            },

            selectBox: {
                options: {
                    model: {
                        optionItems: "{youme.system}.model.ports.outputs"
                    }
                }
            }
        }
    });
})(fluid);
