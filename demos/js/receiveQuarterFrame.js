/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");
    fluid.defaults("youme.demos.quarterFrame.receive", {
        gradeNames: ["youme.templateRenderer"],
        markup: {
            container: "<div class='quarter-frame'><div class='timestamp'></div><div class='input'></div></div>"
        },
        selectors: {
            input: ".input",
            timestamp: ".timestamp"
        },
        model: {
            rate: 3,
            hour: 0,
            minute: 0,
            second: 0,
            frame: 0
        },

        components: {
            timestamp: {
                type: "youme.demos.quarterFrame.timestamp",
                container: "{that}.dom.timestamp",
                options: {
                    model: {
                        hour: "{youme.demos.quarterFrame.receive}.model.hour",
                        minute: "{youme.demos.quarterFrame.receive}.model.minute",
                        second: "{youme.demos.quarterFrame.receive}.model.second",
                        frame: "{youme.demos.quarterFrame.receive}.model.frame"
                    }
                }
            },
            input: {
                type: "youme.portSelectorView.input",
                container: "{that}.dom.input",
                options: {
                    desiredPortSpec: { name: "IAC Driver Bus.+" },
                    listeners: {
                        "onMessage.handleMessage": {
                            funcName: "youme.demos.quarterFrame.receive.handleMessage",
                            args: ["{youme.demos.quarterFrame.receive}", "{arguments}.0"] // message
                        }
                    }
                }
            }
        }
    });

    youme.demos.quarterFrame.receive.handleMessage = function (that, message) {
        if (message.type === "quarterFrameMTC") {
            switch (message.piece) {
                case 0:
                    var oldHighFrameNibble = that.model.frame & 16;
                    var frameValueWithNewLowNibble = oldHighFrameNibble + (message.frame & 15);
                    that.applier.change("frame", frameValueWithNewLowNibble);
                    break;
                case 1:
                    var oldLowFrameNibble = that.model.frame & 15;
                    var frameValueWithNewHighNibble = (message.frame & 16) + oldLowFrameNibble;
                    that.applier.change("frame", frameValueWithNewHighNibble);
                    break;
                case 2:
                    var oldHighSecondNibble = that.model.second & 48;
                    var secondValueWithNewLowNibble = oldHighSecondNibble + (message.second & 15);
                    that.applier.change("second", secondValueWithNewLowNibble);
                    break;
                case 3:
                    var oldLowSecondNibble = that.model.second & 15;
                    var secondValueWithNewHighNibble = (message.second & 48) + oldLowSecondNibble;
                    that.applier.change("second", secondValueWithNewHighNibble);
                    break;
                case 4:
                    var oldHighMinuteNibble = that.model.minute & 48;
                    var minuteValueWithNewLowNibble = oldHighMinuteNibble + (message.minute & 15);
                    that.applier.change("minute", minuteValueWithNewLowNibble);
                    break;
                case 5:
                    var oldLowMinuteNibble = that.model.minute & 15;
                    var minuteValueWithNewHighNibble = (message.minute & 48) + oldLowMinuteNibble;
                    that.applier.change("minute", minuteValueWithNewHighNibble);
                    break;
                case 6:
                    var oldHighHourNibble = that.model.hour & 16;
                    var hourValueWithNewLowNibble = oldHighHourNibble + (message.hour & 15);
                    that.applier.change("hour", hourValueWithNewLowNibble);
                    break;
                case 7:
                    var oldLowHourNibble = that.model.hour & 15;
                    var hourValueWithNewHighNibble = (message.hour & 16) + oldLowHourNibble;
                    that.applier.change("hour", hourValueWithNewHighNibble);
                    that.applier.change("rate", message.rate);
                default:
                    fluid.log(fluid.logLevel.ERROR, "Invalid piece number: " + message.piece);
            }

        }
    };
})(fluid);
