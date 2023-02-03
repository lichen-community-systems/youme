/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/* globals youme */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");
    fluid.registerNamespace("youme.smf");

    /**
     * @typedef SmpteOffset
     * @type {MidiTimeStampBase}
     * @property {String} type - Must be set to `smpteOffset`.
     * @property {number} fractionalFrame - A fraction of time within a single frame, between 0 and 1.
     *
     */

    /**
     *
     * Parse an array of bytes that represent a "standard" MIDI file.
     *
     * @param {Uint8Array} byteArray - An array of bytes.
     * @return {{header: {}, tracks: *[]}} - An object representing the header and all tracks.
     *
     */
    youme.smf.parseSMFByteArray = function (byteArray) {
        var midiObject = {
            errors: [],
            header: {},
            tracks: []
        };
        var index = 0;

        try {
            // Load each "chunk"
            while (index < byteArray.byteLength) {
                var chunkTypeBytes = byteArray.subarray(index, index + 4);

                // The first four characters are the chunk type, either "MThd" (77 84 104 100) or "MTrk" (77 84 114 107).
                // This data consists of unsigned 8-bit integers.
                var chunkType = String.fromCharCode.apply(null, chunkTypeBytes);
                index += 4;

                // The next (bigEndian) 32 bits should be the length of the chunk.
                var chunkLengthBytes = byteArray.subarray(index, index + 4);
                var chunkLength = youme.smf.combineBytes(chunkLengthBytes);
                index += 4;

                switch (chunkType) {
                    case "MThd":
                        // Header
                        midiObject.header = youme.smf.parseHeader(byteArray, index);
                        break;
                    case "MTrk":
                        // Track
                        var track = youme.smf.parseTrack(byteArray, index, chunkLength);
                        midiObject.tracks.push(track);
                        if (track.errors.length) {
                            midiObject.errors.push(...track.errors);
                        }
                        break;
                    default:
                        // Ignore everything else.
                        break;
                }

                // Move the "stylus" forward before we continue to the next section.
                index += chunkLength;
            }
        }
        catch (error) {
            midiObject.errors.push(error);
        }

        return midiObject;
    };

    /**
     *
     * Function to pack multiple 8-bit bytes into a single larger (16 or 32 bit) number.
     *
     * Unsupported, non-API function.
     *
     * @param {Uint8Array<number>} bytesToCombine - The individual bytes to combine.
     * @return {number} - The combined number.
     */
    youme.smf.combineBytes = function (bytesToCombine) {
        var combinedValue = 0;
        for (var i = 0; i < bytesToCombine.length; i++) {
            combinedValue = combinedValue << 8;
            combinedValue += bytesToCombine[i];
        }
        return combinedValue;
    };

    /**
     *
     * Parse the header for an SMF file.
     *
     * Unsupported, non-API function.
     *
     * @param {Uint8Array} byteArray - An array of bytes.
     * @param {number} startingPosition - The starting position of the header.
     * @return {{}} - An object containing the header's metadata.
     *
     */
    youme.smf.parseHeader = function (byteArray, startingPosition) {
        var headerObject = {};

        var formatBytes = byteArray.subarray(startingPosition, startingPosition + 2);
        headerObject.format = youme.smf.combineBytes(formatBytes);

        var trackBytes = byteArray.subarray(startingPosition + 2, startingPosition + 4);
        headerObject.tracks = youme.smf.combineBytes(trackBytes);

        var divisionBytes = byteArray.subarray(startingPosition + 4, startingPosition + 6);
        var rawDivision = youme.smf.combineBytes(divisionBytes);

        headerObject.division = youme.smf.parseDivision(rawDivision);

        return headerObject;
    };

    /**
     *
     * Parse a "raw" division byte into it a data structure.
     *
     * Unsupported, non-API function.
     *
     * @param {number} rawDivision - An single unsigned 32-bit integer.
     * @return {{type: string, resolution: string}} - The data structure that corresponds to the raw division byte.
     */
    youme.smf.parseDivision = function (rawDivision) {
        var divisionObject = { type: "Unknown" };

        // The fifteenth bit indicates which broad scheme (FPS or ticks per quarter note) is being used.  If it's set
        // we're using frames per second.  If not, we're using ticks per quarter note.

        // Frames per Second
        if (rawDivision >>> 15) {
            divisionObject.type = "framesPerSecond";

            // Both the FPS and the units per frame are stored in the remaining 15 bits.  For example, 0xE250 represents
            // 25 FPS, 40 units per frame.

            // Bits 8 through 14 represent the time code format used, see: https://en.wikipedia.org/wiki/MIDI_timecode
            // The most significant bit should always be set to 1 to indicate that the value is negative.
            // So, bits 9 through 14 should correspond to the FPS (with the exception of "30 drop frame", which does
            // not exactly correspond).
            //
            // -24 = 24 fps (film)
            // -25 = 25 fps (PAL)
            // -29 = 29.97 fps, AKA "30 drop frame"
            // -30 = 30 fps, NTSC standard.
            //
            // I would never have made sense of this without this page:
            // https://www.mobilefish.com/tutorials/midi/midi_quickguide_specification.html
            divisionObject.fps = (((~rawDivision) >>> 8) & 127) + 1;

            divisionObject.unitsPerFrame = rawDivision & 127;
        }
        // Ticks Per Quarter Note
        else {
            divisionObject.type = "ticksPerQuarterNote";
            // Bits 14 through 0 represent the number of ticks for each quarter note.
            divisionObject.resolution = rawDivision & 16383;
        }

        return divisionObject;
    };

    /**
     *
     * Parse a single "track" from an SMF file.
     *
     * Unsupported, non-API function.
     *
     * @param {Uint8Array} byteArray - The byte array representing the entire SMF file.
     * @param {number} startingPosition - The starting position in the byte array, not including the track length.
     * @param {number} trackLength - The length of the track, in bytes.
     * @return {{errors: *[], events: *[]}|void} - An object representing the track.
     *
     */
    youme.smf.parseTrack = function (byteArray, startingPosition, trackLength) {
        var trackObject = {
            errors: [],
            events: []
        };

        var timeElapsed = 0;
        var previousMessageBytes = [];

        // We use our own internal "stylus" to avoid manipulating the value we were passed.
        var index = startingPosition;
        while (index < (startingPosition + trackLength)) {
            // Break things down into individual messages, which can be:
            //   1. meta events - FF <type> (byte) <length> (variable) <bytes> (length)
            //   2. control or channel voice messages, which have a fixed length by type.
            //   3. sysex - F0 <variable length> <bytes>

            // The last two types are handled by youme.read already, but we need to also consider how much data remains
            // after the end of the current message.

            var eventObject = {};

            // All messages start with a "delta time"
            var deltaTimePayload = youme.smf.extractVariableLengthValue(byteArray, index);
            timeElapsed += deltaTimePayload.value;

            // To avoid breaking use cases supported by individual "delta time" values, we preserve this information.
            eventObject.deltaTime = deltaTimePayload.value;

            // We also store the time elapsed since the start of the track, to make it easier to schedule everything
            // at once relative to the start of the track.
            eventObject.timeElapsed = timeElapsed;

            index += deltaTimePayload.numBytes;

            var eventFirstByte = byteArray[index];
            index++;

            // Meta events always start with FF <type> <variable length>
            if (eventFirstByte === 0xFF) {
                previousMessageBytes = [];

                var metaEventType = byteArray[index];
                index++;

                var metaEventLengthPayload = youme.smf.extractVariableLengthValue(byteArray, index);
                var payloadLength = metaEventLengthPayload.value;
                index += metaEventLengthPayload.numBytes;

                var metaEventBytes = byteArray.subarray(index, index + payloadLength);
                index += payloadLength;

                eventObject.metaEvent = youme.smf.readMetaEvent(metaEventType, metaEventBytes);
            }
            // Handle "F0" sysex messages.
            else if (eventFirstByte === 0xF0) {
                previousMessageBytes = [];

                var sysexBytes = [0xF0];
                while (byteArray[index] !== 0xF7) {
                    sysexBytes.push(byteArray[index]);
                    index++;
                }
                // One more bump for the last 0xF7
                sysexBytes.push(0xF7);
                index++;
                try {
                    var sysexMessage = youme.read(sysexBytes);
                    eventObject.message = sysexMessage;
                }
                catch (error) {
                    eventObject.error = error;
                    eventObject.rawData = sysexBytes;
                    trackObject.errors.push(error);
                }

            }
            // Handle "F7" sysex message similarly to meta events.
            else if (eventFirstByte === 0xF7) {
                var sysexPayload = youme.smf.extractVariableLengthValue(byteArray, index);
                var sysexPayloadLength = sysexPayload.value;
                index += sysexPayload.numBytes;

                var sysexData = byteArray.subarray(index, index + sysexPayloadLength);
                index += sysexPayloadLength;

                try {
                    var sysexF7Message = youme.read(sysexData);
                    eventObject.message = sysexF7Message;
                }
                catch (error) {
                    eventObject.error = error;
                    eventObject.rawData = sysexData;
                    trackObject.errors.push(error);
                }
            }
            else {
                // Parse the message data out of what's left.
                // The amount of data stored varies by message type
                var messageLength = 0;
                var messageType = eventFirstByte >> 4;

                var isRunningStatus = false;

                switch (messageType) {
                    // Three byte message types:
                    case 14: // Pitchbend
                    case 8:  // Note off
                    case 9:  // Note on
                    case 10: // Polyphonic aftertouch
                    case 11: // Control change
                        messageLength = 3;
                        break;
                    // Two byte message types:
                    case 12: // Program change
                    case 13: // Channel aftertouch
                        messageLength = 2;
                        break;
                    // All "system" messages are one byte.
                    case 15:
                        messageLength = 1;
                        break;
                    default:
                        // Anything else is a "running status" message.
                        isRunningStatus = true;
                        if (previousMessageBytes.length) {
                            messageLength = previousMessageBytes.length  - 1;
                        }
                        else {
                            // Although you can get to this point by erroneously issuing a running status message
                            // before we see a "voice" message, this block is generally reached as a result of gross
                            // formatting errors, like missing or extra bytes. We can't recover, as we lose track of
                            // where we are supposed to be reading the next byte from.
                            var parsingError = new Error("Encountered bad data or a running status message with no corresponding 'voice' message");
                            eventObject.error = parsingError;
                            eventObject.rawData = [messageType];

                            trackObject.errors.push(parsingError);

                            // Return what we've parsed up to this point, including this message.
                            return trackObject;
                        }
                }

                // We have to back up to pick up our first byte again.
                var messageBytes = Array.from(byteArray.subarray(index - 1, index + messageLength));

                // Running status uses the previous event's status (type/channel) byte.
                if (isRunningStatus) {
                    messageBytes.unshift(previousMessageBytes[0]);
                    index += (messageLength - 2);
                }
                else {
                    index += (messageLength - 1);
                }

                try {
                    previousMessageBytes = messageBytes;

                    var message = youme.read(messageBytes);
                    eventObject.message = message;
                }
                catch (error) {
                    eventObject.error = error;
                    trackObject.errors.push(error);
                    eventObject.rawData = messageBytes;
                }
            }

            trackObject.events.push(eventObject);
        }

        return trackObject;
    };

    /**
     *
     * Parse a "variable length" number stored as a series of 7-bit numbers with the last bit reserved to indicate that
     * we have reached the end of the number.  This requires one byte for 0-127, more for anything higher.
     *
     * Unsupported, non-API function.
     *
     * @param {Uint8Array} byteArray - An array of "bytes" represented as 8-bit unsigned integers.
     * @param {number} startingPosition - The starting position in the byte array, not including the track length.
     * @return {{numBytes: number, value: number}} - The value of the number, plus the number of bytes it represents.
     */
    youme.smf.extractVariableLengthValue = function (byteArray, startingPosition) {
        var combinedValue = 0;
        var index = startingPosition;
        while (index < byteArray.length) {
            var thisByte = byteArray[index];
            var thisValue = thisByte & 127;

            combinedValue = combinedValue << 7;
            combinedValue += thisValue;

            index++;

            // Keep going if bit 7 was set, if the values are equal, we're done reading bytes.
            if (thisByte === thisValue) {
                break;
            }
        }

        var numBytes = index - startingPosition;
        return { value: combinedValue, numBytes: numBytes };
    };

    /**
     *
     * Parse a single "meta event".
     *
     * Unsupported, non-API function.
     *
     * @param {number} metaEventType - The type of meta event.
     * @param {Uint8Array} metaEventBytes - The bytes that compose the event, not including those indicating the length.
     * @return {{}} - An object representing the event.
     */
    youme.smf.readMetaEvent = function (metaEventType, metaEventBytes) {
        var metaEventObject = {};
        switch (metaEventType) {
            // FF 00 02 Sequence Number
            case 0x00:
                metaEventObject.type = "sequenceNumber";
                metaEventObject.value = youme.smf.combineBytes(metaEventBytes);
                break;

            // FF 01 len text Text Event
            case 0x01:
                metaEventObject.type = "text";
                metaEventObject.value = String.fromCharCode.apply(null, metaEventBytes);
                break;

            // FF 02 len text Copyright Notice
            case 0x02:
                metaEventObject.type = "copyright";
                metaEventObject.value = String.fromCharCode.apply(null, metaEventBytes);
                break;

            // FF 03 len text Sequence/Track Name
            case 0x03:
                metaEventObject.type = "name";
                metaEventObject.value = String.fromCharCode.apply(null, metaEventBytes);
                break;

            // FF 04 len text Instrument Name
            case 0x04:
                metaEventObject.type = "instrumentName";
                metaEventObject.value = String.fromCharCode.apply(null, metaEventBytes);
                break;

            // FF 05 len text Lyric
            case 0x05:
                metaEventObject.type = "lyric";
                metaEventObject.value = String.fromCharCode.apply(null, metaEventBytes);
                break;

            // FF 06 len text Marker
            case 0x06:
                metaEventObject.type = "marker";
                metaEventObject.value = String.fromCharCode.apply(null, metaEventBytes);
                break;

            // FF 07 len text Cue Point
            case 0x07:
                metaEventObject.type = "cuePoint";
                metaEventObject.value = String.fromCharCode.apply(null, metaEventBytes);
                break;

            // FF 20 01 cc MIDI Channel Prefix
            case 0x20:
                metaEventObject.type = "channelPrefix";
                metaEventObject.value = metaEventBytes[0];
                break;

            // FF 2F 00 End of Track
            case 0x2F:
                metaEventObject.type = "endOfTrack";
                break;

            // FF 51 03 tttttt Set Tempo (in microseconds per MIDI quarter-note)
            case 0x51:
                metaEventObject.type = "tempo";
                // TODO: This seems nonsensical with our existing examples. Investigate.
                metaEventObject.value = youme.smf.combineBytes(metaEventBytes);
                break;

            // FF 54 05 hr mn se fr ff SMPTE Offset
            case 0x54:
                metaEventObject.type = "smpteOffset";
                metaEventObject.hour = metaEventBytes[0];
                metaEventObject.minute = metaEventBytes[1];
                metaEventObject.second = metaEventBytes[2];
                metaEventObject.frame = metaEventBytes[3];
                metaEventObject.fractionalFrame = metaEventBytes[4];
                break;

            // FF 58 04 nn dd cc bb Time Signature
            case 0x58:
                metaEventObject.type = "timeSignature";
                metaEventObject.numerator = metaEventBytes[0];
                metaEventObject.denominator = metaEventBytes[1];
                metaEventObject.midiClocksPerMetronomeClick = metaEventBytes[2];
                metaEventObject.thirtySecondNotesPerMidiQuarterNote = metaEventBytes[3];
                break;

            // FF 59 02 sf mi Key Signature
            case 0x59:
                // Thanks to this page for clarifying how this value is encoded:
                // https://www.recordingblogs.com/wiki/midi-key-signature-meta-message
                metaEventObject.type = "keySignature";
                var sign = (metaEventBytes[0] & 128) ? -1 : 1;
                var value = metaEventBytes[0] & 127;
                metaEventObject.sf = sign * value;
                metaEventObject.mi = metaEventBytes[1] ? "minor" : "major";
                break;

            // FF 7F len data Sequencer Specific Meta-Event
            case 0x7F:
                metaEventObject.type = "sequencerSpecificMetaEvent";
                metaEventObject.value = metaEventBytes;
                break;
            default:
                metaEventObject.type = "Unknown (0x" + (metaEventType).toString(16).padStart(2, 0) + ")";
                metaEventObject.value = metaEventBytes;
        }
        return metaEventObject;
    };

    // TODO: Encoding methods
})(fluid, youme);
