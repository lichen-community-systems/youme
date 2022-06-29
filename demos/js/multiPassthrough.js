/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    fluid.defaults("youme.demos.multiPassthrough", {
        gradeNames: ["youme.templateRenderer"],
        markup: {
            container: "<div class='passthrough-inner-container'><div class='passthrough-inputs'></div><div class='passthrough-outputs'></div></div>"
        },

        selectors: {
            inputs: ".passthrough-inputs",
            outputs: ".passthrough-outputs"
        },

        components: {
            inputs: {
                type: "youme.multiPortSelectorView.inputs",
                container: "{that}.dom.inputs",
                options: {
                    desiredPortSpecs: [
                        { name: "Launchpad Pro .+ (MIDI|Standalone Port)" },
                        { name: "nanoPAD2"}
                    ],
                    listeners: {
                        "onMessage.sendToOutput": "{outputs}.events.sendMessage.fire"
                    }
                }
            },
            outputs: {
                type: "youme.multiPortSelectorView.outputs",
                container: "{that}.dom.outputs",
                options: {
                    desiredPortSpecs: [
                        { name: "IAC Driver Bus 1" },
                        { name: "MIDI Monitor"}
                    ]
                }
            }
        }
    });
})(fluid);
