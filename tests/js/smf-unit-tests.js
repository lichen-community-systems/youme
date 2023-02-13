/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/* globals jqUnit */
(function (fluid, jqUnit) {
    "use strict";
    // TODO: unit tests for helper functions used in parsing / encoding MIDI files.
    var youme = fluid.registerNamespace("youme");

    fluid.registerNamespace("youme.test.smf");

    jqUnit.test("Confirm parseSMFByteArray correctly handles non-byte-array data.", function () {
        var midiObject = youme.smf.parseSMFByteArray({ byteLength: 5});
        jqUnit.assertEquals("There should be a single top-level error.", 1, midiObject.errors.length);
    });

    // TODO: Reuse for encoding tests.
    // All sample values and expected output taken from: https://www.mobilefish.com/tutorials/midi/midi_quickguide_specification.html
    youme.test.smf.divisionExamples = [
        // FPS
        { rawDivision: 0xE878, divisionObject: { type: "framesPerSecond", fps: 24, unitsPerFrame: 120}},
        { rawDivision: 0xE764, divisionObject: { type: "framesPerSecond", fps: 25, unitsPerFrame: 100}},
        // The examples mistakenly said this should be 50 unitsPerFrame, but the bits clearly indicate 80.
        { rawDivision: 0xE350, divisionObject: { type: "framesPerSecond", fps: 29, unitsPerFrame: 80}},
        { rawDivision: 0xE250, divisionObject: { type: "framesPerSecond", fps: 30, unitsPerFrame: 80}},
        // Ticks per quarter note.
        { rawDivision: 0x0080, divisionObject: { type: "ticksPerQuarterNote", resolution: 128}},
        { rawDivision: 0x0050, divisionObject: { type: "ticksPerQuarterNote", resolution: 80}}
    ];

    jqUnit.test("Unit tests for parseDivision.", function () {
        jqUnit.expect(youme.test.smf.divisionExamples.length);
        fluid.each(youme.test.smf.divisionExamples, function (divisionExample) {
            var divisionObject = youme.smf.parseDivision(divisionExample.rawDivision);
            jqUnit.assertDeepEq("The output should be as expected for '0x" + (divisionExample.rawDivision).toString(16) + "'", divisionExample.divisionObject, divisionObject);
        });
    });

    youme.test.smf.metaEventExamples = {
        // FF 00 02 Sequence Number
        "sequence number": {
            bytes: [0x00, 0x02, 0x00, 0x20],
            object: { type: "sequenceNumber", value: 0x20}
        },
        // FF 01 len text Text Event
        "text event": {
            bytes: [0x01, 0x02, 0x3A, 0x29],
            object: { type: "text", value: ":)"}
        },
        // FF 02 len text Copyright Notice
        "copyright notice": {
            bytes: [0x02, 0x02, 0x3B, 0x29],
            object: { type: "copyright", value: ";)"}
        },
        // FF 03 len text Sequence/Track Name
        "sequence/track name": {
            bytes: [0x03, 0x02, 0x3A, 0x50],
            object: { type: "name", value: ":P"}
        },
        // FF 04 len text Instrument Name
        "instrument name": {
            bytes: [0x04, 0x01, 0x3F],
            object: { type: "instrumentName", value: "?"}
        },
        // FF 05 len text Lyric
        "lyric": {
            bytes: [0x05, 0x02, 0x3F, 0x3F],
            object: { type: "lyric", value: "??"}
        },
        // FF 06 len text Marker
        "marker": {
            bytes: [0x06, 0x03, 0x3F, 0x3F, 0x3F],
            object: { type: "marker", value: "???"}
        },
        // FF 07 len text Cue Point
        "cue point": {
            bytes: [0x07, 0x04, 0x3F, 0x3F, 0x3F, 0x3F],
            object: { type: "cuePoint", value: "????"}
        },
        // FF 20 01 cc MIDI Channel Prefix
        "channel prefix": {
            bytes: [0x20, 0x01, 0x09],
            object: { type: "channelPrefix", value: 9 }
        },
        // FF 2F 00 End of Track
        "end of track": {
            bytes: [0x2F, 0x00],
            object: { type: "endOfTrack" }
        },
        // FF 51 03 tttttt Set Tempo (in microseconds per MIDI quarter-note)
        "tempo": {
            bytes: [0x51, 0x03, 0x00, 0x00, 0xFF],
            object: { type: "tempo", value: 255 }
        },
        // FF 54 05 hr mn se fr ff SMPTE Offset
        "SMPTE offset": {
            bytes: [0x54, 0x05, 0x6B, 0x13, 0x19, 0x05, 0x32],
            object: { type: "smpteOffset", rate: 3, hour: 11, minute: 19, second: 25, frame: 5, fractionalFrame: 50 }
        },
        // FF 58 04 nn dd cc bb Time Signature
        "time signature": {
            bytes: [0x58, 0x04, 0x03, 0x04, 0x18, 0x04],
            object: { type: "timeSignature", numerator: 3, denominator: 4, midiClocksPerMetronomeClick: 24, thirtySecondNotesPerMidiQuarterNote: 4 }
        },
        // FF 59 02 sf mi Key Signature
        "key signature, negative sf, minor": {
            bytes: [0x59, 0x02, 0x83, 0x1],
            object: {type: "keySignature", sf: -3, mi: "minor"}
        },
        "key signature, positive sf, major": {
            bytes: [0x59, 0x02, 0x04, 0x0],
            object: {type: "keySignature", sf: 4, mi: "major"}
        },

        // FF 7F len data Sequencer Specific Meta-Event
        "sequencer specific meta event": {
            bytes: [0x7F, 0x02, 0x0B, 0x13],
            object: {type: "sequencerSpecificMetaEvent", value: [0x0B, 0x13] }
        },

        "unknown event": {
            bytes: [0x8F, 0x02, 0x0B, 0x13],
            object: {type: "Unknown (0x8f)", value: [0x0B, 0x13] }
        }
    };

    jqUnit.test("Unit tests for readMetaEvent", function () {
        jqUnit.expect(Object.keys(youme.test.smf.metaEventExamples).length);
        fluid.each(youme.test.smf.metaEventExamples, function (metaEventExample, exampleKey) {
            // Break down the example bytes into <type> <length> <byte>+
            var metaEventType = metaEventExample.bytes[0];
            var metaEventLengthPayload = youme.smf.extractVariableLengthValue(metaEventExample.bytes, 1);
            var payloadLength = metaEventLengthPayload.value;
            var startPos = metaEventLengthPayload.numBytes + 1;
            var metaEventBytes = metaEventExample.bytes.slice(startPos, startPos + payloadLength);

            var metaEventObject =  youme.smf.readMetaEvent(metaEventType, metaEventBytes);
            jqUnit.assertDeepEq("The output should be as expected for example '" + exampleKey + "'.", metaEventExample.object, metaEventObject);
        });
    });
})(fluid, jqUnit);
