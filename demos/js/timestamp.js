/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";

    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.timestamp", {
        gradeNames: ["youme.templateRenderer"],
        model: {
            isRunning: false,

            totalSeconds: 0,

            hour: 0,
            minute: 0,
            second: 0
        },
        selectors: {
            hour: ".timestamp-hour",
            minute: ".timestamp-minute",
            second: ".timestamp-second"
        },
        markup: {
            container: "<div class='timestamp'><div class='timestamp-hour'></div><div class='timestamp-minute'></div><div class='timestamp-second'></div></div>"
        },
        modelListeners: {
            isRunning: {
                funcName: "youme.demos.timestamp.toggleScheduler",
                args: ["{berg.scheduler}", "{that}.model.isRunning", "{that}.tickSecond", "{that}.reset"] // isRunning, tickCallback, resetCallback
            }
        },
        modelRelay: {
            hour: {
                singleTransform: {
                    input: "{that}.model.hour",
                    type: "youme.demos.timestamp.padStart"
                },
                target: "{that}.model.dom.hour.text"
            },
            minute: {
                singleTransform: {
                    input: "{that}.model.minute",
                    type: "youme.demos.timestamp.padStart"
                },
                target: "{that}.model.dom.minute.text"
            },
            second: {
                singleTransform: {
                    input: "{that}.model.second",
                    type: "youme.demos.timestamp.padStart"
                },
                target: "{that}.model.dom.second.text"
            }
        },
        invokers: {
            reset: {
                func: "{that}.applier.change",
                args: ["totalSeconds", -2] // No idea why I have to offset this by two, seems like a timing bug.
            },
            tickSecond: {
                funcName: "youme.demos.timestamp.tickSecond",
                args: ["{that}"]
            }
        },
        components: {
            scheduler: {
                type: "berg.scheduler",
                options: {
                    components: {
                        clock: {
                            type: "berg.clock.raf",
                            options: {
                                freq: 1
                            }
                        }
                    }
                }
            }
        }
    });

    youme.demos.timestamp.tickSecond = function (that) {
        var newSeconds = that.model.totalSeconds + 1;

        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: "totalSeconds", value: newSeconds});

        var newSecond = (60 + Math.round(newSeconds)) % 60;
        transaction.fireChangeRequest({ path: "second", value: newSecond});

        var newMinute = (60 + Math.floor( newSeconds / 60)) % 60;
        transaction.fireChangeRequest({ path: "minute", value: newMinute});

        var newHour   = (24 + Math.floor(newSeconds / 3600)) % 24;
        transaction.fireChangeRequest({ path: "hour", value: newHour});

        transaction.commit();
    };

    youme.demos.timestamp.toggleScheduler = function (scheduler, isRunning, tickCallback, resetCallback) {
        if (isRunning) {
            scheduler.schedule({
                type: "repeat",
                freq: 1,
                callback: tickCallback
            });
            scheduler.start();
        }
        else {
            scheduler.stop();
            scheduler.clearAll();
            resetCallback();
        }
    };

    youme.demos.timestamp.padStart = function (number) {
        return (number).toString().padStart(2, "0");
    };
})(fluid);
