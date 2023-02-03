/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/* globals jqUnit */
(function (fluid, jqUnit) {
    "use strict";
    var youme = fluid.registerNamespace("youme");
    fluid.registerNamespace("youme.test.smf.functional");

    var testDefs = {
        // Examples typed in from the SMF standard.
        "format 0": {
            name: "smf-spec > format-0.mid",
            fileKeys: ["smf-spec", "format-0.mid"],
            expectedErrorCount: 0,
            expectedHeader: {
                format: 0,
                tracks: 1,
                division: {
                    type: "ticksPerQuarterNote",
                    resolution: 96
                }
            }
        },
        "format 1": {
            name: "smf-spec > format-1.mid",
            fileKeys: ["smf-spec", "format-1.mid"],
            expectedErrorCount: 0,
            expectedHeader: {
                format: 1,
                tracks: 4
            }
        },

        // Examples provided by Jazz Soft: https://github.com/jazz-soft/test-midi-files
        "two tracks, type 0": {
            name: "Jazz Soft > test-2-tracks-type-0.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-2-tracks-type-0.mid"],
            expectedErrorCount: 0,
            expectedHeader: { tracks: 2}
        },
        "two tracks, type 1": {
            name: "Jazz Soft > test-2-tracks-type-1.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-2-tracks-type-1.mid"],
            expectedErrorCount: 0,
            expectedHeader: { tracks: 2}
        },
        "two tracks, type 2": {
            name: "Jazz Soft > test-2-tracks-type-2.mid ",
            fileKeys: ["jazzsoft-test-midi-files", "test-2-tracks-type-2.mid"],
            expectedErrorCount: 0,
            expectedHeader: { tracks: 2}
        },

        "all GM percussion": {
            name: "Jazz Soft > test-all-gm-percussion.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-all-gm-percussion.mid"],
            expectedErrorCount: 0
        },
        "all GM sounds": {
            name: "Jazz Soft > test-all-gm-sounds.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-all-gm-sounds.mid"],
            expectedErrorCount: 0
        },
        "all GM2 sounds": {
            name: "Jazz Soft > test-all-gm2-sounds.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-all-gm2-sounds.mid"],
            expectedErrorCount: 0
        },
        "all GS sounds": {
            name: "Jazz Soft > test-all-gs-sounds.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-all-gs-sounds.mid"],
            expectedErrorCount: 0
        },
        "all GS wavetable synth sounds": {
            name: "Jazz Soft > test-all-microsoft-gs-wavetable-synth-sounds.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-all-microsoft-gs-wavetable-synth-sounds.mid"],
            expectedErrorCount: 0
        },
        "all XG sounds": {
            name: "Jazz Soft > test-all-xg-sounds.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-all-xg-sounds.mid"],
            expectedErrorCount: 0
        },
        "test-c-major-scale.mid": {
            name: "Jazz Soft > test-c-major-scale.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-c-major-scale.mid"],
            expectedErrorCount: 0
        },
        "test-control-00-20-bank-select.mid": {
            name: "Jazz Soft > test-control-00-20-bank-select.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-00-20-bank-select.mid"],
            expectedErrorCount: 0
        },
        "test-control-40-damper.mid": {
            name: "Jazz Soft > test-control-40-damper.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-40-damper.mid"],
            expectedErrorCount: 0
        },
        "test-control-41-portamento.mid": {
            name: "Jazz Soft > test-control-41-portamento.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-41-portamento.mid"],
            expectedErrorCount: 0
        },
        "test-control-54-portamento-control.mid": {
            name: "Jazz Soft > test-control-54-portamento-control.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-54-portamento-control.mid"],
            expectedErrorCount: 0
        },
        "test-control-7c-omni-mode-off.mid": {
            name: "Jazz Soft > test-control-7c-omni-mode-off.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-7c-omni-mode-off.mid"],
            expectedErrorCount: 0
        },
        "test-control-7d-omni-mode-on.mid": {
            name: "Jazz Soft > test-control-7d-omni-mode-on.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-7d-omni-mode-on.mid"],
            expectedErrorCount: 0
        },
        "test-control-7e-mono-mode-on.mid": {
            name: "Jazz Soft > test-control-7e-mono-mode-on.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-7e-mono-mode-on.mid"],
            expectedErrorCount: 0
        },
        "test-control-7f-poly-mode-on.mid": {
            name: "Jazz Soft > test-control-7f-poly-mode-on.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-control-7f-poly-mode-on.mid"],
            expectedErrorCount: 0
        },
        "test-empty.mid": {
            name: "Jazz Soft > test-empty.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-empty.mid"],
            expectedErrorCount: 0
        }, // Parses normally.
        "test-gm2-doggy-78-00-38-4c.mid": {
            name: "Jazz Soft > test-gm2-doggy-78-00-38-4c.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-gm2-doggy-78-00-38-4c.mid"],
            expectedErrorCount: 0
        },
        "test-gm2-doggy-79-01-7b.mid": {
            name: "Jazz Soft > test-gm2-doggy-79-01-7b.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-gm2-doggy-79-01-7b.mid"],
            expectedErrorCount: 0
        },
        "test-gs-doggy-01-00-7b.mid": {
            name: "Jazz Soft > test-gs-doggy-01-00-7b.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-gs-doggy-01-00-7b.mid"],
            expectedErrorCount: 0
        },
        "test-karaoke-kar.mid": {
            name: "Jazz Soft > test-karaoke-kar.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-karaoke-kar.mid"],
            expectedErrorCount: 0
        },
        "test-multichannel-chords-0.mid": {
            name: "Jazz Soft > test-multichannel-chords-0.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-multichannel-chords-0.mid"],
            expectedErrorCount: 0
        },
        "test-multichannel-chords-1.mid": {
            name: "Jazz Soft > test-multichannel-chords-1.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-multichannel-chords-1.mid"],
            expectedErrorCount: 0
        },
        "test-multichannel-chords-2.mid": {
            name: "Jazz Soft > test-multichannel-chords-2.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-multichannel-chords-2.mid"],
            expectedErrorCount: 0
        },
        "test-multichannel-chords-3.mid": {
            name: "Jazz Soft > test-multichannel-chords-3.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-multichannel-chords-3.mid"],
            expectedErrorCount: 0
        },
        "test-non-midi-track.mid": {
            name: "Jazz Soft > test-non-midi-track.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-non-midi-track.mid"],
            expectedErrorCount: 0
        }, // non MIDI track should be ignored, and is.
        "test-rpn-00-00-pitch-bend-range.mid": {
            name: "Jazz Soft > test-rpn-00-00-pitch-bend-range.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-rpn-00-00-pitch-bend-range.mid"],
            expectedErrorCount: 0
        },
        "test-rpn-00-01-fine-tuning.mid": {
            name: "Jazz Soft > test-rpn-00-01-fine-tuning.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-rpn-00-01-fine-tuning.mid"],
            expectedErrorCount: 0
        },
        "test-rpn-00-02-coarse-tuning.mid": {
            name: "Jazz Soft > test-rpn-00-02-coarse-tuning.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-rpn-00-02-coarse-tuning.mid"],
            expectedErrorCount: 0
        },
        "test-rpn-00-05-modulation-depth-range.mid": {
            name: "Jazz Soft > test-rpn-00-05-modulation-depth-range.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-rpn-00-05-modulation-depth-range.mid"],
            expectedErrorCount: 0
        },
        "test-smpte-offset.mid": {
            name: "Jazz Soft > test-smpte-offset.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-smpte-offset.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-7e-06-01-id-request.mid": {
            name: "Jazz Soft > test-sysex-7e-06-01-id-request.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-7e-06-01-id-request.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-7e-09-01-gm1-enable.mid": {
            name: "Jazz Soft > test-sysex-7e-09-01-gm1-enable.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-7e-09-01-gm1-enable.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-7e-09-02-gm-disable.mid": {
            name: "Jazz Soft > test-sysex-7e-09-02-gm-disable.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-7e-09-02-gm-disable.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-7e-09-03-gm2-enable.mid": {
            name: "Jazz Soft > test-sysex-7e-09-03-gm2-enable.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-7e-09-03-gm2-enable.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-7f-04-03-master-fine-tuning.mid": {
            name: "Jazz Soft > test-sysex-7f-04-03-master-fine-tuning.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-7f-04-03-master-fine-tuning.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-7f-04-04-master-coarse-tuning.mid": {
            name: "Jazz Soft > test-sysex-7f-04-04-master-coarse-tuning.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-7f-04-04-master-coarse-tuning.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-7x-08-0x-scale-tuning.mid": {
            name: "Jazz Soft > test-sysex-7x-08-0x-scale-tuning.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-7x-08-0x-scale-tuning.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-gs-40-1x-15-drum-part-change.mid": {
            name: "Jazz Soft > test-sysex-gs-40-1x-15-drum-part-change.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-gs-40-1x-15-drum-part-change.mid"],
            expectedErrorCount: 0
        },
        "test-sysex-gs-40-1x-4x-scale-tuning.mid": {
            name: "Jazz Soft > test-sysex-gs-40-1x-4x-scale-tuning.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-sysex-gs-40-1x-4x-scale-tuning.mid"],
            expectedErrorCount: 0
        },
        "test-track-length.mid": {
            name: "Jazz Soft > test-track-length.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-track-length.mid"],
            expectedErrorCount: 0
        },
        "test-xg-doggy-40-00-30.mid": {
            name: "Jazz Soft > test-xg-doggy-40-00-30.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-xg-doggy-40-00-30.mid"],
            expectedErrorCount: 0
        },
        "test-xg-doggy-7e-00-00-54.mid": {
            name: "Jazz Soft > test-xg-doggy-7e-00-00-54.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-xg-doggy-7e-00-00-54.mid"],
            expectedErrorCount: 0
        },
        // We ignore the extra byte, this parses normally.
        "test-corrupt-file-extra-byte.mid": {
            name: "Jazz Soft > test-corrupt-file-extra-byte.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-corrupt-file-extra-byte.mid"],
            expectedErrorCount: 0
        },
        // Song pointer position, not widely supported, but should parse.
        "test-illegal-message-f2-xx-xx.mid": {
            name: "Jazz Soft > test-illegal-message-f2-xx-xx.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f2-xx-xx.mid"],
            expectedErrorCount: 0
        },
        // Song select, not widely supported, but should parse.
        "test-illegal-message-f3-xx.mid": {
            name: "Jazz Soft > test-illegal-message-f3-xx.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f3-xx.mid"],
            expectedErrorCount: 0
        },
        // Tune request, not widely supported, but should parse.
        "test-illegal-message-f6.mid": {
            name: "Jazz Soft > test-illegal-message-f6.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f6.mid"],
            expectedErrorCount: 0
        },
        // Timing clock, not widely supported, but should parse.
        "test-illegal-message-f8.mid": {
            name: "Jazz Soft > test-illegal-message-f8.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f8.mid"],
            expectedErrorCount: 0
        },
        // Start, not widely supported, but should parse.
        "test-illegal-message-fa.mid": {
            name: "Jazz Soft > test-illegal-message-fa.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-fa.mid"],
            expectedErrorCount: 0
        },
        // Continue, not widely supported, but should parse.
        "test-illegal-message-fb.mid": {
            name: "Jazz Soft > test-illegal-message-fb.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-fb.mid"],
            expectedErrorCount: 0
        },
        // Stop, not widely supported, but should parse.
        "test-illegal-message-fc.mid": {
            name: "Jazz Soft > test-illegal-message-fc.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-fc.mid"],
            expectedErrorCount: 0
        },
        // Active sensing, not widely supported, but should parse.
        "test-illegal-message-fe.mid": {
            name: "Jazz Soft > test-illegal-message-fe.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-fe.mid"],
            expectedErrorCount: 0
        },

        // Should parse with top-level errors.
        "test-corrupt-file-missing-byte.mid": {
            name: "Jazz Soft > test-corrupt-file-missing-byte.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-corrupt-file-missing-byte.mid"],
            expectedErrorCount: 1
        },
        "test-illegal-message-all.mid": {
            name: "Jazz Soft > test-illegal-message-all.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-all.mid"],
            expectedErrorCount: 3,
            shouldFail: true
        },

        // quarter-frame MTC.
        "test-illegal-message-f1-xx.mid": {
            name: "Jazz Soft > test-illegal-message-f1-xx.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f1-xx.mid"],
            expectedErrorCount: 0
        },

        // Should parse, but have should have top-level, track, and event errors.
        "test-illegal-message-f4.mid": {
            name: "Jazz Soft > test-illegal-message-f4.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f4.mid"],
            expectedErrorCount: 1,
            shouldFail: true
        },
        "test-illegal-message-f5.mid": {
            name: "Jazz Soft > test-illegal-message-f5.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f5.mid"],
            expectedErrorCount: 1,
            shouldFail: true
        },
        "test-illegal-message-f9.mid": {
            name: "Jazz Soft > test-illegal-message-f9.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-f9.mid"],
            expectedErrorCount: 1,
            shouldFail: true
        },
        "test-illegal-message-fd.mid": {
            name: "Jazz Soft > test-illegal-message-fd.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-illegal-message-fd.mid"],
            expectedErrorCount: 1,
            shouldFail: true
        },

        // Good tests for timestamp offset, all should parse without any errors.
        "test-vlq-2-byte.mid": {
            name: "Jazz Soft > test-vlq-2-byte.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-vlq-2-byte.mid"],
            expectedErrorCount: 0
        },
        "test-vlq-3-byte.mid": {
            name: "Jazz Soft > test-vlq-3-byte.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-vlq-3-byte.mid"],
            expectedErrorCount: 0
        },
        "test-vlq-4-byte.mid": {
            name: "Jazz Soft > test-vlq-4-byte.mid",
            fileKeys: ["jazzsoft-test-midi-files", "test-vlq-4-byte.mid"],
            expectedErrorCount: 0
        }
    };

    youme.test.smf.functional.checkSingleFile = function (testDef) {
        jqUnit.test(testDef.name, function () {
            var toParse = fluid.get(youme.tests.midi, testDef.fileKeys);
            jqUnit.assertNotUndefined("There should be MIDI file content to evaluate.", toParse);

            var byteArray = new Uint8Array(toParse);

            // TODO: Discuss with Antranig, I couldn't catch `fluid.fail` calls from `youme.read` with a try/catch or
            //  expectFrameworkDiagnostic.
            if (testDef.shouldFail) {
                fluid.failureEvent.removeListener(jqUnit.failureHandler);
            }
            var midiObject = youme.smf.parseSMFByteArray(byteArray);
            if (testDef.shouldFail) {
                fluid.failureEvent.addListener(jqUnit.failureHandler, "jqUnit", "before:fail");
            }

            if (testDef.expectedHeader !== undefined) {
                jqUnit.assertLeftHand("The header should be as expected.", testDef.expectedHeader, midiObject.header);
            }

            var expectedErrors = testDef.expectedErrorCount ? testDef.expectedErrorCount : 0;

            var errorCheckMessage = "There should" + (expectedErrors ? " " : " not ") + "be errors.";
            jqUnit.assertEquals(errorCheckMessage, expectedErrors, midiObject.errors.length);

            var trackErrorCount = 0;
            var eventErrorCount = 0;
            fluid.each(midiObject.tracks, function (trackObject) {
                trackErrorCount += trackObject.errors.length;
                fluid.each(trackObject.events, function (event) {
                    if (event.error) {
                        eventErrorCount++;
                    }
                });
            });

            jqUnit.assertEquals("The number of track errors should match the top-level count.", expectedErrors, trackErrorCount);

            jqUnit.assertTrue("The number of event errors should be less than or equal to the top-level count.", eventErrorCount <= expectedErrors);
        });
    };

    fluid.each(testDefs, youme.test.smf.functional.checkSingleFile);
})(fluid, jqUnit);
