/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    // TODO: Add support for virtual ports.
    fluid.defaults("youme.multiPortSelectorView", {
        gradeNames: ["fluid.viewComponent"],

        selectBoxLabel: "MIDI Port:",

        model: {
            selectedPortIds: [],
            portSpecs: []
        },

        components: {
            system: {
                type: "youme.system"
            },
            portConnector: {
                type: "youme.multiPortConnector",
                options: {
                    model: {
                        portSpecs: "{multiPortSelectorView}.model.portSpecs"
                    }
                }
            },

            selectBox: {
                type: "youme.multiSelectBox",
                container: "{that}.container",
                options: {
                    model: {
                        label: "{youme.multiPortSelectorView}.options.selectBoxLabel",
                        selectedItemIds: "{youme.multiPortSelectorView}.model.selectedPortIds"
                    }
                }
            }
        },

        modelListeners: {
            selectedPortIds: {
                funcName: "youme.multiPortSelectorView.updatePortSpecs",
                args: ["{that}"]
            }
        }
    });

    youme.multiPortSelectorView.updatePortSpecs = function (that) {
        var updatedPortSpecs = [];
        fluid.each(that.model.selectedPortIds, function (selectedPortId) {
            updatedPortSpecs.push({ id: selectedPortId});
        });

        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: "portSpecs", type: "DELETE" });
        transaction.fireChangeRequest({ path: "portSpecs", value: updatedPortSpecs});
        transaction.commit();
    };

    fluid.defaults("youme.multiPortSelectorView.inputs", {
        gradeNames: ["youme.multiPortSelectorView", "youme.messageReceiver"],

        selectBoxLabel: "MIDI Inputs:",

        components: {
            portConnector: {
                type: "youme.multiPortConnector.inputs",
                options: {
                    listeners: {
                        "onActiveSense.relay": "{youme.multiPortSelectorView.inputs}.events.onActiveSense.fire",
                        "onAftertouch.relay": "{youme.multiPortSelectorView.inputs}.events.onAftertouch.fire",
                        "onClock.relay": "{youme.multiPortSelectorView.inputs}.events.onClock.fire",
                        "onContinue.relay": "{youme.multiPortSelectorView.inputs}.events.onContinue.fire",
                        "onControl.relay": "{youme.multiPortSelectorView.inputs}.events.onControl.fire",
                        "onMessage.relay": "{youme.multiPortSelectorView.inputs}.events.onMessage.fire",
                        "onNoteOff.relay": "{youme.multiPortSelectorView.inputs}.events.onNoteOff.fire",
                        "onNoteOn.relay": "{youme.multiPortSelectorView.inputs}.events.onNoteOn.fire",
                        "onPitchbend.relay": "{youme.multiPortSelectorView.inputs}.events.onPitchbend.fire",
                        "onProgram.relay": "{youme.multiPortSelectorView.inputs}.events.onProgram.fire",
                        "onRaw.relay": "{youme.multiPortSelectorView.inputs}.events.onRaw.fire",
                        "onReset.relay": "{youme.multiPortSelectorView.inputs}.events.onReset.fire",
                        "onSongPointer.relay": "{youme.multiPortSelectorView.inputs}.events.onSongPointer.fire",
                        "onSongSelect.relay": "{youme.multiPortSelectorView.inputs}.events.onSongSelect.fire",
                        "onStart.relay": "{youme.multiPortSelectorView.inputs}.events.onStart.fire",
                        "onStop.relay": "{youme.multiPortSelectorView.inputs}.events.onStop.fire",
                        "onSysex.relay": "{youme.multiPortSelectorView.inputs}.events.onSysex.fire",
                        "onTuneRequest.relay": "{youme.multiPortSelectorView.inputs}.events.onTuneRequest.fire"
                    }
                }
            },

            selectBox: {
                type: "youme.multiSelectBox",
                container: "{that}.container",
                options: {
                    model: {
                        optionItems: "{youme.system}.model.ports.inputs"
                    }
                }
            }
        }
    });

    fluid.defaults("youme.multiPortSelectorView.outputs", {
        gradeNames: ["youme.multiPortSelectorView", "youme.messageSender"],

        selectBoxLabel: "MIDI Outputs:",

        components: {
            portConnector: {
                type: "youme.multiPortConnector.outputs",
                options: {
                    events: {
                        sendActiveSense: "{youme.multiPortSelectorView.outputs}.events.sendActiveSense",
                        sendAftertouch: "{youme.multiPortSelectorView.outputs}.events.sendAftertouch",
                        sendClock: "{youme.multiPortSelectorView.outputs}.events.sendClock",
                        sendContinue: "{youme.multiPortSelectorView.outputs}.events.sendContinue",
                        sendControl: "{youme.multiPortSelectorView.outputs}.events.sendControl",
                        sendMessage: "{youme.multiPortSelectorView.outputs}.events.sendMessage",
                        sendNoteOff: "{youme.multiPortSelectorView.outputs}.events.sendNoteOff",
                        sendNoteOn: "{youme.multiPortSelectorView.outputs}.events.sendNoteOn",
                        sendPitchbend: "{youme.multiPortSelectorView.outputs}.events.sendPitchbend",
                        sendProgram: "{youme.multiPortSelectorView.outputs}.events.sendProgram",
                        sendRaw: "{youme.multiPortSelectorView.outputs}.events.sendRaw",
                        sendReset: "{youme.multiPortSelectorView.outputs}.events.sendReset",
                        sendSongPointer: "{youme.multiPortSelectorView.outputs}.events.sendSongPointer",
                        sendSongSelect: "{youme.multiPortSelectorView.outputs}.events.sendSongSelect",
                        sendStart: "{youme.multiPortSelectorView.outputs}.events.sendStart",
                        sendStop: "{youme.multiPortSelectorView.outputs}.events.sendStop",
                        sendSysex: "{youme.multiPortSelectorView.outputs}.events.sendSysex",
                        sendTuneRequest: "{youme.multiPortSelectorView.outputs}.events.sendTuneRequest"
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
