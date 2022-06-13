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

    fluid.defaults("youme.test.portMatcher", {
        gradeNames: ["fluid.component"],

        name: "Port matcher tests",

        testPort: {
            id: "12345678",
            manufacturer: "KORG INC.",
            name: "SLIDER/KNOB"
        },

        testSpecs: [
            {
                name: "ID match",
                matchSpec: {
                    id: "12345678"
                },
                shouldMatch: true
            },
            {
                name: "ID mismatch",
                matchSpec: {
                    id: "87654321"
                },
                shouldMatch: false
            },
            {
                name: "Single-property complete match",
                matchSpec: {
                    manufacturer: "KORG INC."
                },
                shouldMatch: true
            },
            {
                name: "Single property mismatch",
                matchSpec: {
                    manufacturer: "AKAI"
                },
                shouldMatch: false
            },
            {
                name: "Multiple property complete match",
                matchSpec: {
                    manufacturer: "KORG INC.",
                    name: "SLIDER/KNOB"
                },
                shouldMatch: true
            },
            {
                name: "Multiple property mismatch",
                matchSpec: {
                    manufacturer: "AKAI",
                    name: "SLIDER/KNOB"
                },
                shouldMatch: false
            },
            {
                name: "Single property partial match",
                matchSpec: {
                    manufacturer: "KORG"
                },
                shouldMatch: true
            },
            {
                name: "Multiple property partial match",
                matchSpec: {
                    manufacturer: "KORG",
                    name: "SLIDER"
                },
                shouldMatch: true
            },
            {
                name: "Single property regexp match",
                matchSpec: {
                    name: "sl.der"
                },
                shouldMatch: true
            },
            {
                name: "Multiple property regexp match",
                matchSpec: {
                    manufacturer: "k.rg",
                    name: "sl.der"
                },
                shouldMatch: true
            },
            {
                name: "Single property regexp mismatch",
                matchSpec: {
                    name: "[0-9]+"
                },
                shouldMatch: false
            },
            {
                name: "Multiple property regexp match",
                matchSpec: {
                    manufacturer: "x+",
                    name: "z+"
                },
                shouldMatch: false
            }
        ],

        listeners: {
            "onCreate.runTests": {
                funcName: "youme.test.portMatcher.run",
                args: [
                    "{that}.options.name",
                    "{that}.options.testPort",
                    "{that}.options.testSpecs"
                ]
            }
        }
    });

    youme.test.portMatcher.test = function (testPort, testSpec) {
        jqUnit.test(testSpec.name, function () {
            var matcher = youme.findPorts.matcherFromPortSpec(testSpec.matchSpec);

            var msg = testSpec.shouldMatch ? "The match specification should have matched the port." :
                "The match specification should not have matched the port.";

            var didMatch = matcher(testPort);

            jqUnit.assertEquals(msg, testSpec.shouldMatch, didMatch);
        });
    };

    youme.test.portMatcher.run = function (moduleName, testPort, testSpecs) {
        jqUnit.module(moduleName);
        fluid.each(testSpecs, function (testSpec) {
            youme.test.portMatcher.test(testPort, testSpec);
        });
    };

    youme.test.portMatcher();
})(fluid);
