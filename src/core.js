/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/*global Uint8Array*/
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    /**
     * @typedef PortSpec
     * @type {Object}
     * @property {String} id - The unique ID of the device associated with the port.
     * @property {String} name - The name of the device associated with the port.
     * @property {String} manufacturer - The manufacturer of the device associated with the port.
     * @property {String} type - The type of port, either "input", or "output".
     * @property {String} state - The state of the port, either "open", "pending", or "closed".
     * @property {String} connected - "connected" if the port is connected, "disconnected" otherwise.
     */

    /**
     * @typedef CallRegister
     * @property {Array<Array>} send - An array of the arguments passed when called the mock's `send` method.
     * @property {Array<Array>} clear - An array of the arguments passed when called the mock's `clear` method.
     * @property {Array<Array>} open - An array of the arguments passed when called the mock's `opeen` method.
     * @property {Array<Array>} close - An array of the arguments passed when called the mock's `close` method.
     */

    /**
     * @typedef MIDIPort
     * @type {Object}
     * @property {String} id - The unique ID of the device associated with the port.
     * @property {String} name - The name of the device associated with the port.
     * @property {String} manufacturer - The manufacturer of the device associated with the port.
     * @property {String} type - The type of port, either "input", or "output".
     * @property {String} state - The state of the port, either "open", "pending", or "closed".
     * @property {String} connected - "connected" if the port is connected, "disconnected" otherwise.
     * @property {Function} send - A function that handles requests to send messages to this port.
     * @property {Function} clear - A function that handles requests to clear messages in progress being sent by this port.
     * @property {Function} open - A function that will handle requests to open a connection to this port.
     * @property {Function} close - A function that will handle requests to close the connection to this port.
     */

    /** @typedef MIDIInput
     * @type {MIDIPort}
     * @property {AddEventListener} addEventListener - Add a listener for events the input receives.
     * @property {DispatchEvent} dispatchEvent - Dispatch an event to this input.
     */

    /**
     * @typedef MIDIOutput
     * @type {MIDIPort}
     * @property {Function} send - A function that handles requests to send messages to this port.
     * @property {Function} clear - A function that handles requests to clear messages in progress being sent by this port.
     */

    /**
     * An array of data representing a MIDI message, for full details, see:
     * https://www.midi.org/specifications-old/item/table-1-summary-of-midi-message
     *
     * @typedef MIDIMessageData
     * @type {Uint8Array}
     *
     */
    youme.requestAccess = function (sysex, software, onAccessGranted, onError) {
        if (!navigator.requestMIDIAccess) {
            var msg = "The Web MIDI API is not available. You may need to enable it in your browser's settings.";
            fluid.log(fluid.logLevel.WARN, msg);
            onError(msg);
            return;
        }

        var p = navigator.requestMIDIAccess({
            sysex: sysex,
            software: software
        });

        p.then(onAccessGranted, onError);

        return p;
    };

    youme.getPorts = function (access) {
        var ports = {};

        ports.inputs  = [...access.inputs.values()];
        ports.outputs = [...access.outputs.values()];

        return ports;
    };

    youme.requestPorts = function (success, error, software) {
        function wrappedSuccess(access) {
            var ports = youme.getPorts(access);
            success(ports);
        }

        youme.requestAccess(false, software, wrappedSuccess, error);
    };

    youme.portsToViews = function (portsArray) {
        return fluid.transform(portsArray, function (port) {
            return fluid.filterKeys(port, ["id", "name", "manufacturer", "state", "connection"]);
        });
    };

    youme.prettyPrintPorts = function (ports) {
        return fluid.prettyPrintJSON({
            inputs: youme.portsToViews(ports.inputs),
            outputs: youme.portsToViews(ports.outputs)
        });
    };

    youme.logPorts = function (software) {
        function success(ports) {
            var printed = youme.prettyPrintPorts(ports);
            console.log(printed); // eslint-disable-line no-console
        }

        function error(err) {
            console.log(err); // eslint-disable-line no-console
        }

        youme.requestPorts(success, error, software);
    };

    /**
     *
     * Convert incoming MIDI data (in bytes) to a JSON structure describing the message.
     *
     * @param {MIDIMessageData} data - The raw data of the MIDI message.
     * @return {Object} - The corresponding message structure as a serialisable object.
     *
     */
    youme.read = function (data) {
        var status = data[0],
            type = status >> 4,
            channel = status & 0xf,
            fn;

        switch (type) {
            case 8:
                fn = youme.read.noteOff;
                break;
            case 9:
                fn = data[2] > 0 ? youme.read.noteOn : youme.read.noteOff;
                break;
            case 10:
                fn = youme.read.polyAftertouch;
                break;
            case 11:
                fn = youme.read.controlChange;
                break;
            case 12:
                fn = youme.read.programChange;
                break;
            case 13:
                fn = youme.read.channelAftertouch;
                break;
            case 14:
                fn = youme.read.pitchbend;
                break;
            case 15:
                // Handles the following message types:
                // - activeSense
                // - clock
                // - continue
                // - reset
                // - songPointer
                // - songSelect
                // - start
                // - stop
                // - sysex
                // - tuneRequest
                fn = youme.read.system;
                break;
            default:
                return fluid.fail("Received an unrecognized MIDI message: " +
                    fluid.prettyPrintJSON(data));
        }

        return fn(channel, data);
    };

    // Unsupported, non-API function.
    youme.read.note = function (type, channel, data) {
        return {
            type: type,
            channel: channel,
            note: data[1],
            velocity: data[2]
        };
    };

    // Unsupported, non-API function.
    youme.read.noteOn = function (channel, data) {
        return youme.read.note("noteOn", channel, data);
    };

    // Unsupported, non-API function.
    youme.read.noteOff = function (channel, data) {
        return youme.read.note("noteOff", channel, data);
    };

    // Unsupported, non-API function.
    youme.read.polyAftertouch = function (channel, data) {
        return {
            type: "aftertouch",
            channel: channel,
            note: data[1],
            pressure: data[2]
        };
    };

    // Unsupported, non-API function.
    youme.read.controlChange = function (channel, data) {
        return {
            type: "control",
            channel: channel,
            number: data[1],
            value: data[2]
        };
    };

    // Unsupported, non-API function.
    youme.read.programChange = function (channel, data) {
        return {
            type: "program",
            channel: channel,
            program: data[1]
        };
    };

    // Unsupported, non-API function.
    youme.read.channelAftertouch = function (channel, data) {
        return {
            type: "aftertouch",
            channel: channel,
            pressure: data[1]
        };
    };

    // Unsupported, non-API function.
    youme.read.twoByteValue = function (data) {
        return (data[2] << 7) | data[1];
    };

    // Unsupported, non-API function.
    youme.read.pitchbend = function (channel, data) {
        return {
            type: "pitchbend",
            channel: channel,
            value: youme.read.twoByteValue(data)
        };
    };

    // Unsupported, non-API function.
    youme.read.system = function (status, data) {
        if (status === 1) {
            return youme.messageFailure("quarter frame MTC");
        }

        var fn;
        switch (status) {
            case 0:
                fn = youme.read.sysex;
                break;
            case 2:
                fn = youme.read.songPointer;
                break;
            case 3:
                fn = youme.read.songSelect;
                break;
            case 6:
                fn = youme.read.tuneRequest;
                break;
            case 8:
                fn = youme.read.clock;
                break;
            case 10:
                fn = youme.read.start;
                break;
            case 11:
                fn = youme.read["continue"];
                break;
            case 12:
                fn = youme.read.stop;
                break;
            case 14:
                fn = youme.read.activeSense;
                break;
            case 15:
                fn = youme.read.reset;
                break;
            default:
                return fluid.fail("Received an unrecognized MIDI system message: " +
                    fluid.prettyPrintJSON(data));
        }

        return fn(data);
    };

    // Unsupported, non-API function.
    youme.messageFailure = function (type) {
        fluid.fail("Unsupported MIDI message type '" + type + "'.");
    };

    // Unsupported, non-API function.
    youme.read.sysex = function (data) {
        var begin = data[0] === 0xF0 ? 1 : 0,
            end = data.length - (data[data.length - 1] === 0xF7 ? 1 : 0);

        // Avoid copying the data if we're working with a typed array.
        var trimmedData = data instanceof Uint8Array ?
            data.subarray(begin, end) :
            data.slice(begin, end);

        return {
            type: "sysex",
            data: trimmedData
        };
    };

    // Unsupported, non-API function.
    youme.read.valueMessage = function (type, value) {
        return {
            type: type,
            value: value
        };
    };

    // Unsupported, non-API function.
    youme.read.songPointer = function (data) {
        var val = youme.read.twoByteValue(data);
        return youme.read.valueMessage("songPointer", val);
    };

    // Unsupported, non-API function.
    youme.read.songSelect = function (data) {
        return youme.read.valueMessage("songSelect", data[1]);
    };

    // Unsupported, non-API function.
    youme.read.tuneRequest = function () {
        return {
            type: "tuneRequest"
        };
    };

    youme.systemRealtimeMessages = [
        "tuneRequest",
        "clock",
        "start",
        "continue",
        "stop",
        "activeSense",
        "reset"
    ];

    // Unsupported, non-API function.
    youme.createSystemRealtimeMessageReaders = function (systemRealtimeMessages) {
        fluid.each(systemRealtimeMessages, function (type) {
            youme.read[type] = function () {
                return {
                    type: type
                };
            };
        });
    };

    // Unsupported, non-API function.
    youme.createSystemRealtimeMessageReaders(youme.systemRealtimeMessages);


    /**
     *
     * Take a MIDI messageSpec object and convert it to an array of raw bytes suitable for sending to a MIDI device.
     *
     * @param {Object} midiMessage - a MIDI messageSpec object
     * @return {MIDIMessageData} - an array containing the encoded MIDI message's bytes
     *
     */
    youme.write = function (midiMessage) {
        if (midiMessage.type === "sysex") {
            return youme.write.sysex(midiMessage);
        }

        // MIDI status nibbles are helpfully documented in this
        // SparkFun article:
        // https://learn.sparkfun.com/tutorials/midi-tutorial/all#messages
        switch (midiMessage.type) {
            case "activeSense":
                return youme.write.singleByteMessage(15, 14);
            case "aftertouch":
                return youme.write.aftertouch(midiMessage);
            case "clock":
                return youme.write.singleByteMessage(15, 8);
            case "continue":
                return youme.write.singleByteMessage(15, 11);
            case "control":
                return youme.write.controlChange(midiMessage);
            case "noteOn":
                return youme.write.note(9, midiMessage);
            case "noteOff":
                return youme.write.note(8, midiMessage);
            case "pitchbend":
                return youme.write.largeValueMessage(14, midiMessage.channel, midiMessage);
            case "program":
                return youme.write.programChange(midiMessage);
            case "reset":
                return youme.write.singleByteMessage(15, 15);
            case "songPointer":
                return youme.write.largeValueMessage(15, 2, midiMessage);
            case "songSelect":
                return youme.write.largeValueMessage(15, 3, midiMessage);
            case "start":
                return youme.write.singleByteMessage(15, 10);
            case "stop":
                return youme.write.singleByteMessage(15, 12);
            case "tuneRequest":
                return youme.write.singleByteMessage(15, 6);
            default:
                fluid.fail("Cannot write an unrecognized MIDI message of type '" + midiMessage.type + "'.");
        }
    };

    // Unsupported, non-API function.
    youme.write.note = function (status, midiMessage) {
        return youme.write.threeByteMessage(status, midiMessage.channel,
            midiMessage.note, midiMessage.velocity);
    };

    // Unsupported, non-API function.
    youme.write.controlChange = function (midiMessage) {
        return youme.write.threeByteMessage(11, midiMessage.channel,
            midiMessage.number, midiMessage.value);
    };

    // Unsupported, non-API function.
    youme.write.programChange = function (midiMessage) {
        return youme.write.twoByteMessage(12, midiMessage.channel, midiMessage.program);
    };

    // Unsupported, non-API function.
    youme.write.aftertouch = function (midiMessage) {
        // polyAfterTouch
        if (midiMessage.note) {
            return youme.write.threeByteMessage(10, midiMessage.channel, midiMessage.note, midiMessage.pressure);
        }

        // afterTouch
        return youme.write.twoByteMessage(13, midiMessage.channel, midiMessage.pressure);
    };

    // Unsupported, non-API function.
    youme.write.singleByteMessage = function (msNibble, lsNibble) {
        var data = new Uint8Array(1);
        data[0] = youme.write.statusByte(msNibble, lsNibble);
        return data;
    };

    // Unsupported, non-API function.
    youme.write.twoByteMessage = function (msNibble, lsNibble, data1) {
        var data = new Uint8Array(2);
        data[0] = youme.write.statusByte(msNibble, lsNibble);
        data[1] = data1;
        return data;
    };

    // Unsupported, non-API function.
    youme.write.threeByteMessage = function (msNibble, lsNibble, data1, data2) {
        var data = new Uint8Array(3);
        data[0] = youme.write.statusByte(msNibble, lsNibble);
        data[1] = data1;
        data[2] = data2;
        return data;
    };

    // Unsupported, non-API function.
    youme.write.largeValueMessage = function (msNibble, lsNibble, midiMessage) {
        var data = new Uint8Array(3);
        data[0] = youme.write.statusByte(msNibble, lsNibble);
        youme.write.twoByteValue(midiMessage.value, data, 1);
        return data;
    };

    /**
     *
     * Output a status byte.
     *
     * @param {Number} msNibble - the first nibble of the status byte (often the command code).
     * @param {Number} lsNibble - the second nibble of the status byte (often the channel).
     * @return {Byte} A status byte that combines the two inputs.
     */
    // Unsupported, non-API function.
    youme.write.statusByte = function (msNibble, lsNibble) {
        return (msNibble << 4) + lsNibble;
    };

    /**
     *
     * Converts a 14-bit numeric value to two MIDI bytes.
     *
     * @param {Number} value - A 14-bit number to convert
     * @param {Unit8TypedArray} array - An array to write the value to.
     * @param {Integer} offset - The optional offset in the array to start writing at. Defaults to 0.
     *
     */
    // Unsupported, non-API function.
    youme.write.twoByteValue =  function (value, array, offset) {
        offset = offset || 0;
        array[offset] = value & 0x7f; // LSB
        array[offset + 1] = (value >> 7) & 0x7f; // MSB
    };

    /**
     *
     * Convert a MIDI Message represented as a Javascript Object into a Sysex message represented as a Uint8Array.
     *
     * NOTE: This function does not accept framing, i.e. a leading 0xF0 and/or trailing 0xF7, and will fail if called
     * with either.
     *
     * @param {Object} midiMessage - The MIDI message represented as a Javascript Object.
     * @return {Uint8Array} - The sysex message.
     */
    // Unsupported, non-API function.
    youme.write.sysex = function (midiMessage) {
        if (midiMessage.data[0] === 0xF0 || midiMessage.data[midiMessage.data.length - 1] === 0xF7) {
            fluid.fail("Sysex payloads should not include framing bytes.");
        }

        var data = midiMessage.data,
            len = data.length;

        var framedData = new Uint8Array(len + 2);
        framedData[0] = 0xF0;
        framedData[len + 1] = 0xF7;
        framedData.set(data, 1);

        return framedData;
    };

    /**
     *
     * Search a map of available ports for matches.
     *
     * @param {Array<MIDIPort>} ports - The ports to search.
     * @param {PortSpec} portSpec - An object that describes the desired port.
     * @return {Array<MIDIPort>} - An array of matching inputs.
     *
     */
    youme.findPorts = function (ports, portSpec) {
        var portFinder = youme.findPorts.portFinder(portSpec);
        var matches = portFinder(ports);
        return matches;
    };

    /**
     *
     * Create a "matcher" based on a port specification.
     *
     * @param {PortSpec} portSpec - An object that describes the desired port.
     * @return {Function} - A function that accepts an array of midi ports and returns any matches.
     *
     */
    youme.findPorts.portFinder = function (portSpec) {
        var matcher = youme.findPorts.matcherFromPortSpec(portSpec);

        return function (ports) {
            return ports.filter(matcher);
        };
    };

    youme.findPorts.matcherFromPortSpec = function (portSpec) {
        if (portSpec.id) {
            return youme.findPorts.idMatcher(portSpec.id);
        }
        else if (portSpec.manufacturer !== undefined || portSpec.name !== undefined) {
            var filteredMatchSpec = fluid.filterKeys(portSpec, ["manufacturer", "name"]);
            return youme.findPorts.patternMatcher(filteredMatchSpec);
        }
        // If we have no ID, manufacturer, or name, there can be no matches.
        else {
            return function () { return false; };
        }
    };

    /**
     *
     * Treat an input string as a case-insensitive regular expression to match a property against.
     *
     * @param {PortSpec} matchSpec - A partial port specification referencing one or more string properties (name, manufacturer).
     * @return {function(*): boolean} - A matcher that can be passed to Array.filter().
     *
     */
    youme.findPorts.patternMatcher = function (matchSpec) {
        return function (obj) {
            var isMatch;
            for (var prop in matchSpec) {

                var objVal = obj[prop];
                var matchVal = matchSpec[prop];

                if (objVal === matchVal) {
                    isMatch = true;
                }
                else {
                    // If both are undefined, consider it a match.
                    if (objVal === undefined && matchVal === undefined) {
                        isMatch = true;
                    }
                    // If both have values, compare them.
                    else if (objVal !== undefined && matchVal !== undefined) {
                        // This works for strings and values (boolean, numbers) that can be coerced well to strings,
                        // but has side effects when working with arrays and objects.
                        var regexp = new RegExp(matchVal, "i");
                        isMatch = regexp.test(objVal);
                    }
                    // If either but not both are undefined, return false;
                    else {
                        isMatch = false;
                    }
                }

                // If we already know it's not a match, stop checking already.
                if (!isMatch) {
                    break;
                }
            }

            return isMatch;
        };
    };

    youme.findPorts.idMatcher = function (id) {
        return function (port) {
            return port.id === id;
        };
    };
})(fluid);
