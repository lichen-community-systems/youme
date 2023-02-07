/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");
    fluid.defaults("youme.demos.quarterFrame.send", {
        gradeNames: ["youme.templateRenderer", "youme.messageSender"],
        markup: {
            container: "<div class='quarter-frame'><div class='timestamp'></div><div class='outputs'></div></div>"
        },
        selectors: {
            outputs: ".outputs",
            timestamp: ".timestamp"
        },
        model: {
            timestamp: 0,
            direction: 1,
            piece: 0,
            rate: 3,
            hour: 0,
            minute: 0,
            second: 0,
            frame: 0
        },

        invokers: {
            handleQuarterFrame: {
                funcName: "youme.demos.quarterFrame.send.handleQuarterFrame",
                args: ["{that}"]
            }
        },

        listeners: {
            "onCreate.startScheduler": {
                funcName: "youme.demos.quarterFrame.send.startScheduler",
                args: ["{that}"]
            },
            "sendMessage.sendToOutputs": "{outputs}.events.sendMessage.fire"
        },

        components: {
            // TODO: Something to control direction.
            timestamp: {
                type: "youme.demos.quarterFrame.timestamp",
                container: "{that}.dom.timestamp",
                options: {
                    model: {
                        timestamp: "{youme.demos.quarterFrame.send}.model.timestamp",
                        hour: "{youme.demos.quarterFrame.send}.model.hour",
                        minute: "{youme.demos.quarterFrame.send}.model.minute",
                        second: "{youme.demos.quarterFrame.send}.model.second",
                        frame: "{youme.demos.quarterFrame.send}.model.frame"
                    }
                }
            },
            outputs: {
                type: "youme.multiPortSelectorView.outputs",
                container: "{that}.dom.outputs",
                options: {
                    desiredPortSpecs: ["Arturia BeatStep"]
                }
            },
            scheduler: {
                type: "berg.scheduler",
                options: {
                    components: {
                        clock: {
                            type: "berg.clock.raf",
                            options: {
                                freq: 60 // times per second
                            }
                        }
                    }
                }
            }
        }
    });

    // I am choosing not to properly deal with drop frame, and pretend it's just 30 FPS.
    youme.demos.quarterFrame.send.rates = [24, 25, 30, 30];

    youme.demos.quarterFrame.send.startScheduler = function (that) {
        that.scheduler.schedule({
            type: "repeat",
            // These are both about the best I can get the RAF scheduler to do.
            // A `freq` higher than 100 hangs the window.
            freq: 100,
            // An `interval` less than 0.01 hangs the window.
            // interval: 0.01,
            callback: that.handleQuarterFrame
        });

        that.scheduler.start();
    };

    youme.demos.quarterFrame.send.handleQuarterFrame = function (that) {
        // Set the time values to match the current moment.
        var quarterFrameMessage = {
            type: "quarterFrameMTC",
            piece: that.model.piece,
            rate: that.model.rate,
            hour: that.model.hour,
            minute: that.model.minute,
            second: that.model.second,
            frame: that.model.frame
        };

        // Send the quarter-frame MTC to any connected devices.
        that.events.sendMessage.fire(quarterFrameMessage);

        // Batch all model updates, as we'll be making them quite frequently.
        var transaction = that.applier.initiate();

        // Track the elapsed time internally rather than peeking at the current time.
        var fps = youme.demos.quarterFrame.send.rates[that.model.rate];
        var msPerPiece = (1000 / (fps * 4));
        var newTimestamp = that.model.timestamp + (that.model.direction * msPerPiece);
        var newSecond = (60 + Math.round(newTimestamp  / 1000)) % 60;
        var newMinute = (60 + Math.floor( newTimestamp / 60000)) % 60;
        var newHour   = (24 + Math.floor(newTimestamp / 3600000)) % 24;
        transaction.fireChangeRequest({ path: "timestamp", value: newTimestamp});
        transaction.fireChangeRequest({ path: "second", value: newSecond});
        transaction.fireChangeRequest({ path: "minute", value: newMinute});
        transaction.fireChangeRequest({ path: "hour", value: newHour});

        // Update the frame in whichever direction we're going.
        if ((that.model.direction === 1 && that.model.piece === 7) || (that.model.direction === -1 && that.model.piece === 0)) {
            var nextFrame = (fps + that.model.frame + (that.model.direction * 2)) % fps;
            transaction.fireChangeRequest({ path: "frame", value: nextFrame});
        }
        // Update the piece in whichever direction we're going.
        var nextPiece = (8 + that.model.piece + that.model.direction) % 8;
        transaction.fireChangeRequest({ path: "piece", value: nextPiece});
        transaction.commit();
    };
})(fluid);
