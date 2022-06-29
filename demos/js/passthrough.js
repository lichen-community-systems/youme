/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    fluid.defaults("youme.demos.passthrough", {
        gradeNames: ["youme.templateRenderer"],
        markup: {
            container: "<div class='passthrough-inner-container'><div class='passthrough-input'></div><div class='passthrough-output'></div></div>"
        },

        selectors: {
            input: ".passthrough-input",
            output: ".passthrough-output"
        },

        components: {
            input: {
                type: "youme.portSelectorView.input",
                container: "{that}.dom.input",
                options: {
                    desiredPortSpec: {
                        name: "Launchpad Pro .+ (MIDI|Standalone Port)"
                    },
                    listeners: {
                        "onMessage.sendToOutput": "{output}.events.sendMessage.fire"
                    }
                }
            },
            output: {
                type: "youme.portSelectorView.output",
                container: "{that}.dom.output",
                options: {
                    desiredPortSpec: {
                        name: "IAC Driver Bus 1"
                    }
                }
            }
        }
    });
})(fluid);
