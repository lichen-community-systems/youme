/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";

    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.quarterFrame.timestamp", {
        gradeNames: ["youme.templateRenderer"],
        model: {
            hour: 0,
            minute: 0,
            second: 0,
            frame: 0
        },
        selectors: {
            hour: ".timestamp-hour",
            minute: ".timestamp-minute",
            second: ".timestamp-second",
            frame: ".timestamp-frame"
        },
        markup: {
            container: "<div class='timestamp'><div class='timestamp-hour'></div><div class='timestamp-minute'></div><div class='timestamp-second'></div><div class='timestamp-frame'></div></div>"
        },
        modelRelay: {
            hour: {
                singleTransform: {
                    input: "{that}.model.hour",
                    type: "youme.demos.quarterFrame.timestamp.padStart"
                },
                target: "{that}.model.dom.hour.text"
            },
            minute: {
                singleTransform: {
                    input: "{that}.model.minute",
                    type: "youme.demos.quarterFrame.timestamp.padStart"
                },
                target: "{that}.model.dom.minute.text"
            },
            second: {
                singleTransform: {
                    input: "{that}.model.second",
                    type: "youme.demos.quarterFrame.timestamp.padStart"
                },
                target: "{that}.model.dom.second.text"
            },
            frame: {
                singleTransform: {
                    input: "{that}.model.frame",
                    type: "youme.demos.quarterFrame.timestamp.padStart"
                },
                target: "{that}.model.dom.frame.text"
            }
        }
    });

    youme.demos.quarterFrame.timestamp.padStart = function (number) {
        return (number).toString().padStart(2, "0");
    };
})(fluid);
