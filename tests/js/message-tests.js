/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/*global jqUnit */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.test.messageTests", {
        gradeNames: ["fluid.component"],

        testSpecs: {
            "note on": {
                messageSpec: {
                    type: "noteOn",
                    channel: 0,
                    note: 60,
                    velocity: 69
                },
                bytes: [0x90, 0x3C, 0x45]
            },

            "note off": {
                messageSpec: {
                    channel: 0,
                    note: 60,
                    type: "noteOff",
                    velocity: 0
                },
                bytes: [0x80, 0x3C, 0x00]
            },

            "non-polyphonic aftertouch": {
                messageSpec: {
                    type: "aftertouch",
                    channel: 0,
                    pressure: 87
                },
                bytes: [0xD0, 0x57]
            },

            "polyphonic aftertouch": {
                messageSpec: {
                    type: "aftertouch",
                    channel: 0,
                    note: 60,
                    pressure: 69
                },
                bytes: [0xA0, 0x3C, 0x45]
            },

            "control": {
                messageSpec: {
                    type: "control",
                    channel: 2,
                    number: 74,
                    value: 116
                },
                bytes: [0xB2, 0x4A, 0x74]
            },

            "program change": {
                messageSpec: {
                    program: 7,
                    channel: 2,
                    type: "program"
                },
                bytes: [0xC2, 0x07]
            },

            "pitchbend": {
                messageSpec: {
                    type: "pitchbend",
                    channel: 1,
                    value: 5888
                },
                bytes: [0xE1, 0x00, 0x2E]
            },

            "sysex without framing bytes included": {
                messageSpec: {
                    type: "sysex",
                    data: [0, 32, 8, 16, 127, 0, 1]
                },
                bytes: [0xF0, 0x00, 0x20, 0x08, 0x10, 0x7F, 0x00, 0x01, 0xF7]
            },

            "song position pointer": {
                messageSpec: {
                    type: "songPointer",
                    value: 1
                },
                bytes: [0xF2, 0x01, 0x00]
            },

            "song select": {
                messageSpec: {
                    type: "songSelect",
                    value: 1
                },
                bytes: [0xF3, 0x01, 0x00]
            },

            "tune request": {
                messageSpec: {
                    type: "tuneRequest"
                },
                bytes: [0xF6]
            },

            "clock": {
                messageSpec: {
                    type: "clock"
                },
                bytes: [0xF8]
            },

            "clock start": {
                messageSpec: {
                    type: "start"
                },
                bytes: [0xFA]
            },

            "clock continue": {
                messageSpec: {
                    type: "continue"
                },
                bytes: [0xFB]
            },

            "clock stop": {
                messageSpec: {
                    type: "stop"
                },
                bytes: [0xFC]
            },

            "reset": {
                messageSpec: {
                    type: "reset"
                },
                bytes: [0xFF]
            },

            "active sense": {
                messageSpec: {
                    type: "activeSense"
                },
                bytes: [0xFE]
            },

            "quarter frame MTC, piece 0": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 0,
                    frame: 15
                },
                bytes: [0xF1, 0x0F]
            },

            "quarter frame MTC, piece 1": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 1,
                    frame: 16
                },
                bytes: [0xF1, 0x11]
            },

            "quarter frame MTC, piece 2": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 2,
                    second: 15
                },
                bytes: [0xF1, 0x2F]
            },

            "quarter frame MTC, piece 3": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 3,
                    second: 48
                },
                bytes: [0xF1, 0x33]
            },

            "quarter frame MTC, piece 4": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 4,
                    minute: 14
                },
                bytes: [0xF1, 0x4E]
            },

            "quarter frame MTC, piece 5": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 5,
                    minute: 48
                },
                bytes: [0xF1, 0x53]
            },

            "quarter frame MTC, piece 6": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 6,
                    hour: 13
                },
                bytes: [0xF1, 0x6D]
            },

            "quarter frame MTC, piece 7": {
                messageSpec: {
                    type: "quarterFrameMTC",
                    piece: 7,
                    rate: 3,
                    hour: 16
                },
                bytes: [0xF1, 0x77]
            }
        },

        invokers: {
            test: "fluid.notImplemented"
        },

        listeners: {
            "onCreate.runTests": {
                funcName: "youme.test.messageTests.run",
                args: "{that}"
            }
        }
    });

    youme.test.messageTests.run = function (that) {
        fluid.each(that.options.testSpecs, function (testSpec, name) {
            that.test(testSpec, name);
        });
    };

    fluid.defaults("youme.test.encodingTests", {
        gradeNames: "youme.test.messageTests",

        name: "MIDI encoding tests",

        testSpecs: {
            "sysex without framing bytes": {
                messageSpec: {
                    type: "sysex",
                    data: [0, 32, 8, 16, 127, 0, 1]
                },
                bytes: [0xF0, 0x00, 0x20, 0x08, 0x10, 0x7F, 0x00, 0x01, 0xF7]
            },

            "sysex with only the closing byte": {
                messageSpec: {
                    type: "sysex",
                    data: [0, 32, 8, 16, 127, 0, 1, 0xF7]
                },
                shouldFail: true,
                expectedErrors: ["Sysex payloads should not include framing bytes."]
            },

            "sysex with only the opening byte": {
                messageSpec: {
                    type: "sysex",
                    data: [0xF0, 0, 32, 8, 16, 127, 0, 1]
                },
                shouldFail: true,
                expectedErrors: ["Sysex payloads should not include framing bytes."]
            },

            "sysex with both opening and closing bytes": {
                messageSpec: {
                    type: "sysex",
                    data: [0xF0, 0, 32, 8, 16, 127, 0, 1, 0xF7]
                },
                shouldFail: true,
                expectedErrors: ["Sysex payloads should not include framing bytes."]
            }
        },

        invokers: {
            test: {
                funcName: "youme.test.encodingTests.testEncoding",
                args: [
                    "{that}",
                    "{arguments}.0",
                    "{arguments}.1"
                ]
            }
        }
    });

    youme.test.encodingTests.testEncoding = function (that, testSpec, name) {
        jqUnit.test("Encode a " + name + " message", function () {
            var testFunction = function () { return youme.write(testSpec.messageSpec); };
            if (testSpec.shouldFail) {
                jqUnit.expectFrameworkDiagnostic("The write call should result in an error.", testFunction, testSpec.expectedErrors);
            }
            else {
                var actual = testFunction();
                jqUnit.assertDeepEq("The MIDI messageSpec should have been correctly encoded as raw bytes.", new Uint8Array(testSpec.bytes), actual);
            }
        });
    };

    youme.test.encodingTests();

    fluid.defaults("youme.test.decodingTests", {
        gradeNames: "youme.test.messageTests",

        name: "MIDI decoding tests",

        testSpecs: {
            "note off as zero-velocity note on": {
                messageSpec: {
                    channel: 0,
                    note: 60,
                    type: "noteOff",
                    velocity: 0
                },
                bytes: [0x90, 0x3C, 0x00]
            },
            "invalid message type": {
                bytes: [0x15, 0x00, 0x00],
                shouldFail: true,
                errorMessages: ["Received an unrecognized MIDI message"]
            }
        },

        invokers: {
            test: {
                funcName: "youme.test.decodingTests.testDecoding",
                args: [
                    "{that}",
                    "{arguments}.0",
                    "{arguments}.1"
                ]
            }
        }
    });

    youme.test.decodingTests.testDecoding = function (that, testSpec, name) {
        jqUnit.test("Decode a " + name + " message", function () {
            var testFunction = function () { return youme.read(testSpec.bytes); };
            if (testSpec.shouldFail) {
                jqUnit.expectFrameworkDiagnostic("The read call should result in an error.", testFunction, testSpec.expectedErrors);
            }
            else {
                var actual = testFunction();
                jqUnit.assertDeepEq("The raw MIDI bytes should have been correctly decoded into a messageSpec object.", testSpec.messageSpec, actual);

            }
        });
    };

    youme.test.decodingTests();
})(fluid);
