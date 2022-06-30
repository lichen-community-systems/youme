/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    /**
     *
     * A MIDI Connection represents a connection to a single input or output port. Unless you are completing the wiring
     * yourself, you should not use this directly, but should use `youme.connection.input` or `youme.connection.output`
     * instead.
     *
     **/
    fluid.defaults("youme.connection", {
        gradeNames: ["fluid.modelComponent"],

        model: {
            port: false,
            open: false
        },

        events: {
            onPortOpen: null,
            onPortClose: null,
            onError: null
        },

        listeners: {
            "onError.logError": {
                funcName: "fluid.log",
                args: [fluid.logLevel.WARN, "{arguments}.0"]
            }
        },

        modelListeners: {
            open: {
                funcName: "youme.connection.updateConnectionState",
                args: ["{that}.model.port", "{that}.model.open", "{that}.events.onPortOpen.fire", "{that}.events.onPortClose.fire", "{that}.events.onError.fire"] // port, isNowOpen, onPortOpen, onPortClose, onError
            },
            port: {
                excludeSource: "init", // On startup, both open and port are set, so we let the open listener decide whether to open the port.
                funcName: "youme.connection.handlePortChange",
                args: ["{change}.oldValue", "{that}.model.port", "{that}.model.open", "{that}.events.onPortOpen.fire", "{that}.events.onPortClose.fire", "{that}.events.onError.fire"] // oldPort, newPort, isOpen, onPortOpen, onPortClose, onError
            }
        }
    });

    youme.connection.handlePortChange = function (oldPort, newPort, isOpen, onPortOpen, onPortClose, onError) {
        if (oldPort) {
            oldPort.close();
        }

        if (newPort) {
            youme.connection.updateConnectionState(newPort, isOpen, onPortOpen, onPortClose, onError);
        }
    };

    youme.connection.updateConnectionState = function (port, isOpen, onPortOpen, onPortClose, onError) {
        if (port) {
            if (isOpen) {
                youme.connection.open(port, onPortOpen, onError);
            }
            else {
                youme.connection.close(port, onPortClose, onError);
            }
        }
        else {
            onError("Port is missing, cannot update connection state.");
        }
    };

    youme.connection.open = function (port, onPortOpen, onError) {
        var portOpenPromise = port.open();
        portOpenPromise.then(onPortOpen, onError);
    };

    youme.connection.close = function (port, onPortClose, onError) {
        var portClosePromise = port.close();
        portClosePromise.then(onPortClose, onError);
    };

    fluid.defaults("youme.connection.input", {
        gradeNames: ["youme.connection", "youme.messageReceiver"],

        listeners: {
            "onPortOpen.startListening": {
                funcName: "youme.connection.input.startListening",
                args: ["{that}.model.port", "{that}.events.onRaw.fire"]
            },
            "onPortClose.stopListening": {
                funcName: "youme.connection.input.stopListening",
                args: ["{that}.model.port", "{that}.events.onRaw.fire"]
            },
            "onRaw.fireMidiEvent": {
                funcName: "youme.connection.fireEvent",
                args: ["{arguments}.0", "{that}.events"]
            }
        }
    });

    youme.connection.input.startListening = function (port, onRaw) {
        if (port) {
            port.addEventListener("midimessage", onRaw, false);
        }
    };

    youme.connection.input.stopListening = function (port, onRaw) {
        if (port) {
            port.removeEventListener("midimessage", onRaw, false);
        }
    };

    youme.connection.fireEvent = function (midiEvent, events) {
        var model = youme.read(midiEvent.data);

        events.onMessage.fire(model, midiEvent);

        var eventType = youme.connection.prefixCamelCase("on", model.type);
        var eventForType = events[eventType] || undefined;

        if (eventForType) {
            eventForType.fire(model, midiEvent);
        }
    };

    /**
     *
     * A function to support prefixes that distinguish events that result from incoming messages from events that are
     * fired to initiate outgoing messages. Incoming events are prefixed with "on", outgoing events are prefixed with
     * "send", as in "onNoteOn" and "sendNoteOn".
     *
     * @param {String} prefix - The prefix to prepend to the final result.
     * @param {String} suffix - The suffix, which will have its first letter capitalised.
     * @return {String} - The combined prefix and suffix as a single string.
     *
     */
    youme.connection.prefixCamelCase = function (prefix, suffix) {
        var toJoin = [prefix];
        if (suffix && suffix.length) {
            toJoin.push(suffix.substring(0,1).toUpperCase());
            if (suffix.length > 1) {
                toJoin.push(suffix.substring(1));
            }
        }
        return toJoin.join("");
    };

    fluid.defaults("youme.connection.output", {
        gradeNames: ["youme.connection", "youme.messageSender"],

        listeners: {
            "sendActiveSense.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "activeSense", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendAftertouch.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "aftertouch", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendClock.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "clock", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendContinue.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "continue", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendControl.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "control", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendMessage.send": {
                funcName: "youme.connection.output.send",
                args: ["{that}.model.port", "{arguments}.0", "{that}.events.onError.fire"] // port, midiMessage, onError
            },
            "sendNoteOn.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "noteOn", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendNoteOff.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "noteOff", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendPitchbend.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "pitchbend", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendProgram.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "program", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendRaw.send": {
                funcName: "youme.connection.output.send",
                args: ["{that}.model.port", "{arguments}.0", "{that}.events.onError.fire"] // port, midiMessage, onError
            },
            "sendReset.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "reset", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType, onError
            },
            "sendSysex.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "sysex", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType
            },
            "sendSongPointer.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "songPointer", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType
            },
            "sendSongSelect.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "songSelect", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType
            },
            "sendStart.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "start", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType
            },
            "sendStop.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "stop", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType
            },
            "sendTuneRequest.send": {
                funcName: "youme.connection.output.sendMessageOfType",
                args: ["{that}.model.port", "{arguments}.0", "tuneRequest", "{that}.events.onError.fire"] // port, midiMessage, allowedMessageType
            }
        }
    });

    youme.connection.output.sendMessageOfType = function (port, midiMessage, allowedMessageType, onError) {
        if (midiMessage.type === allowedMessageType) {
            youme.connection.output.send(port, midiMessage, onError);
        }
    };

    /**
     *
     * Sends a MIDI message.
     *
     * @param {MIDIOutput} port - The MIDI output port.
     * @param {Object} midiMessage - A MIDI messageSpec
     * @param {Function} onError - The function to use to report any errors.
     *
     */
    youme.connection.output.send = function (port, midiMessage, onError) {
        if (port) {
            var midiBytes = youme.write(midiMessage);
            port.send(midiBytes);
        }
        else {
            onError("Can't send a message to a non-existent port.");
        }
    };
})(fluid);
