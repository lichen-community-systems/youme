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
            container: "<div class='quarter-frame'><button class='start-button'>Start</button><button class='stop-button'>Stop</button><div class='timestamp'></div><div class='outputs'></div></div>"
        },
        selectors: {
            outputs: ".outputs",
            startButton: ".start-button",
            stopButton: ".stop-button",
            timestamp: ".timestamp"
        },
        model: {
            isRunning: false,

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
            },
            handleStartButtonClick: {
                funcName: "youme.demos.quarterFrame.send.handleButtonClick",
                args: ["{that}", true] // newIsRunning
            },
            handleStopButtonClick: {
                funcName: "youme.demos.quarterFrame.send.handleButtonClick",
                args: ["{that}", false] // newIsRunning
            }
        },

        modelRelay: {
            startButtonToggle: {
                target: "{that}.model.dom.startButton.enabled",
                singleTransform: {
                    "type": "fluid.transforms.condition",
                    "condition": "{that}.model.isRunning",
                    "true": false,
                    "false": true
                }
            },
            stopButtonToggle: {
                source: "isRunning",
                target: "{that}.model.dom.stopButton.enabled"
            }
        },

        modelListeners: {
            isRunning: {
                funcName: "youme.demos.quarterFrame.send.toggleScheduler",
                args: ["{berg.scheduler}", "{change}.value"] // scheduler, isRunning
            }
        },

        listeners: {
            "onCreate.scheduleUpdates": {
                funcName: "youme.demos.quarterFrame.send.scheduleUpdates",
                args: ["{berg.scheduler}", "{that}.handleQuarterFrame"] // scheduler, invoker
            },
            "onCreate.bindStartButton": {
                this: "{that}.dom.startButton",
                method: "click",
                args: ["{that}.handleStartButtonClick"]
            },
            "onCreate.bindStopButton": {
                this: "{that}.dom.stopButton",
                method: "click",
                args: ["{that}.handleStopButtonClick"]
            },
            "sendMessage.sendToOutputs": "{outputs}.events.sendMessage.fire"
        },

        components: {
            // TODO: Something to control direction.
            timestamp: {
                type: "youme.demos.timestamp",
                container: "{that}.dom.timestamp",
                options: {
                    model: {
                        isRunning: "{youme.demos.quarterFrame.send}.model.isRunning"
                    }
                }
            },
            outputs: {
                type: "youme.multiPortSelectorView.outputs",
                container: "{that}.dom.outputs"
            },
            scheduler: {
                type: "berg.scheduler",
                options: {
                    components: {
                        clock: {
                            type: "berg.clock.raf",
                            options: {
                                freq: 30 // times per second
                            }
                        }
                    }
                }
            }
        }
    });

    youme.demos.quarterFrame.send.handleButtonClick = function (that, newIsRunning) {
        that.applier.change("isRunning", newIsRunning);
    };

    // I am choosing not to properly deal with drop frame, and pretend it's just 30 FPS.
    youme.demos.quarterFrame.send.rates = [24, 25, 30, 30];

    youme.demos.quarterFrame.send.toggleScheduler = function (scheduler, isRunning) {
        if (isRunning) {
            scheduler.start();
        }
        else {
            scheduler.stop();
        }
    };

    youme.demos.quarterFrame.send.scheduleUpdates = function (scheduler, callback) {
        scheduler.schedule({
            type: "repeat",
            freq: 30,
            callback: callback
        });
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
        transaction.fireChangeRequest({ path: "timestamp", value: newTimestamp});

        var newSecond = (60 + Math.round(newTimestamp  / 1000)) % 60;
        // Gate all the other updates conditionally to avoid a torrent of unnecessary evaluations downstream.
        if (newSecond !== that.model.second) {
            transaction.fireChangeRequest({ path: "second", value: newSecond});
        }

        var newMinute = (60 + Math.floor( newTimestamp / 60000)) % 60;
        if (newMinute !== that.model.minute) {
            transaction.fireChangeRequest({ path: "minute", value: newMinute});
        }

        var newHour   = (24 + Math.floor(newTimestamp / 3600000)) % 24;
        if (newHour !== that.model.hour) {
            transaction.fireChangeRequest({ path: "hour", value: newHour});
        }

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
