/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    // TODO: Add support / controls for looping.  Maybe switch to "repeat" events?
    fluid.defaults("youme.demos.smf.player", {
        gradeNames: ["youme.templateRenderer", "youme.messageSender"],
        markup: {
            container: "<div class='smf-player'><input type='file' class='smf-player-file-input'/><div class='playback-controls'></div><div class='timestamp'></div><div><h3>Ticks Elapsed</h3><p class='ticks-elapsed'>0</p></div><div class='outputs'></div></div>"
        },
        selectors: {
            controls: ".playback-controls",
            fileInput: ".smf-player-file-input",
            outputs: ".outputs",
            ticksElapsed: ".ticks-elapsed",
            timestamp: ".timestamp"
        },

        events: {
            createScheduler: null
        },

        members: {
            currentSeconds: 0
        },

        model: {
            // TODO: Display file metadata onscreen.
            fileName: "No file selected",

            // MIDI file information
            midiObject: {},

            // Onscreen timestamp
            hour: 0,
            minute: 0,
            second: 0,
            frame: 0,

            fps: 30,

            // TODO: Hide this once we figure out the odd timing issues with various files.
            ticksElapsed: 0,

            isRunning: false
        },

        invokers: {
            handleFileInputChange: {
                funcName: "youme.demos.smf.player.handleFileInputChange",
                args: ["{that}", "{that}.dom.fileInput"] // HTMLInputElement
            }
        },

        listeners: {
            "onCreate.bindFileInputChange": {
                this: "{that}.dom.fileInput",
                method: "change",
                args: "{that}.handleFileInputChange"
            },

            "sendMessage.sendToOutputs": "{outputs}.events.sendMessage.fire"
        },

        modelListeners: {
            isRunning: {
                excludeSource: "init",
                funcName: "youme.demos.smf.player.handleRunningStateChange",
                args: ["{that}"]
            }
        },

        modelRelay: {
            ticksElapsed: {
                source: "ticksElapsed",
                target: "{that}.model.dom.ticksElapsed.text"
            }
        },

        components: {
            timestamp: {
                type: "youme.demos.timestamp",
                container: "{that}.dom.timestamp",
                options: {
                    model: {
                        timestamp: "{youme.demos.smf.player}.model.timestamp",
                        hour: "{youme.demos.smf.player}.model.hour",
                        minute: "{youme.demos.smf.player}.model.minute",
                        second: "{youme.demos.smf.player}.model.second",
                        frame: "{youme.demos.smf.player}.model.frame"
                    }
                }
            },
            outputs: {
                type: "youme.multiPortSelectorView.outputs",
                container: "{that}.dom.outputs"
            },
            scheduler: {
                type: "berg.scheduler",
                createOnEvent: "{that}.events.createScheduler",
                options: {
                    components: {
                        clock: {
                            // type: "berg.clock.raf",
                            type: "berg.clock.autoAudioContext",
                            options: {
                                freq: 120 // times per second
                                // freq: 60
                            }
                        }
                    }
                }
            },
            controls: {
                type: "youme.templateRenderer",
                container: "{that}.dom.controls",
                options: {
                    model: {
                        isRunning: "{youme.demos.smf.player}.model.isRunning"
                    },
                    modelRelay: {
                        startButtonToggle: {
                            target: "{that}.model.dom.start.enabled",
                            singleTransform: {
                                "type": "fluid.transforms.condition",
                                "condition": "{that}.model.isRunning",
                                "true": false,
                                "false": true
                            }
                        },
                        stopButtonToggle: {
                            source: "isRunning",
                            target: "{that}.model.dom.stop.enabled"
                        }
                    },
                    markup: {
                        container: "<div class='controls'><button class='start'>Start</button><button class='stop' enabled='false'>Stop</button></div>"
                    },
                    selectors: {
                        start: ".start",
                        stop: ".stop"
                    },
                    invokers: {
                        handleStartButtonClick: {
                            funcName: "youme.demos.smf.player.handleStartButtonClick",
                            args: ["{youme.demos.smf.player}"]
                        },
                        handleStopButtonClick: {
                            func: "{that}.applier.change",
                            args: ["isRunning", false]
                        }
                    },
                    listeners: {
                        "onCreate.bindStartButton": {
                            this: "{that}.dom.start",
                            method: "click",
                            args: ["{that}.handleStartButtonClick"]
                        },
                        "onCreate.bindStopButton": {
                            this: "{that}.dom.stop",
                            method: "click",
                            args: ["{that}.handleStopButtonClick"]
                        }
                    }
                }
            }
        }
    });

    youme.demos.smf.player.handleStartButtonClick = function (that) {
        if (that.scheduler) {
            that.applier.change("isRunning", false);

            // TODO: We can't stop a single scheduler, but we also don't seem to be able to recreate one without
            // hitting a Fluid error.
            try {
                // TODO: Ask Colin about the error here.
                // bergson-only.js:1376 Uncaught DOMException: Failed to execute 'disconnect' on 'AudioNode': the given destination is not connected.
                //     at berg.clock.autoAudioContext.stop (file:///Users/duhrer/Source/projects/youme/node_modules/bergson/dist/bergson-only.js:1376:20)
                //     at togo (file:///Users/duhrer/Source/projects/youme/node_modules/infusion/dist/infusion-all.js:148:99135)
                //     at fire (file:///Users/duhrer/Source/projects/youme/node_modules/infusion/dist/infusion-all.js:139:25883)
                //     at invokeInvoker (file:///Users/duhrer/Source/projects/youme/node_modules/infusion/dist/infusion-all.js:148:97450)
                //     at togo (file:///Users/duhrer/Source/projects/youme/node_modules/infusion/dist/infusion-all.js:148:99135)
                //     at fire (file:///Users/duhrer/Source/projects/youme/node_modules/infusion/dist/infusion-all.js:139:25883)
                //     at fluid.componentConstructor.invokeInvoker [as stop] (file:///Users/duhrer/Source/projects/youme/node_modules/infusion/dist/infusion-all.js:148:97450)
                //     at <anonymous>:1:21
                that.scheduler.stop();
            }
            catch (e) {
                fluid.log(fluid.logLevel.WARN, "Error stopping scheduler.");
            }
            that.scheduler.clearAll();
        }
        else {
            // Create the scheduler now while we are clothed in divine user intent.
            that.events.createScheduler.fire();
        }

        that.applier.change("isRunning", true);
    };

    youme.demos.smf.player.handleRunningStateChange = function (that) {
        if (that.model.isRunning) {
            if (fluid.get(that, "model.midiObject.tracks.length")) {
                // This should no longer be necessary, as we have recreated the scheduler.
                // that.scheduler.clearAll();

                // There are three file types we need to support:
                //
                //   0: single track with meta events generally at timestamp 0.
                //   1: multiple parallel tracks, meta events (including timing) in the first track.
                //   2: multiple parallel tracks with independent timing per track.

                // When working with type 1 files, we need to hold onto meta events such as tempo for all tracks.
                var commonMetaEvents = [];

                // We want to stop after the last tick required for any track.
                var maxTrackTime = 0;
                fluid.each(that.model.midiObject.tracks, function (singleTrack, trackNumber) {
                    if (that.model.midiObject.header.format === 1 && trackNumber === 0) {
                        // TODO: Pull out the FPS and initial tempo for timekeeping purposes.
                        commonMetaEvents = singleTrack.events;
                    }
                    else {
                        var eventsToProcess = commonMetaEvents.concat(singleTrack.events);
                        eventsToProcess.sort(youme.demos.smf.player.sortByTicksElapsed);

                        // Start with what's in the header and update as we go.
                        var ticksPerQuarterNote = that.model.midiObject.header.division.resolution;

                        // Arbitrary default to line up "ticks per quarter note" with the timestamp.
                        var fps = 30;

                        var secondsPerQuarterNote = .5;

                        // The default beat time, 0.5 seconds, divided by the default ticks/beat, 60.
                        // var secondsPerTick = 0.008333333333333;
                        var secondsPerTick = that.model.secondsPerTick;

                        if (that.model.midiObject.header.division.type === "ticksPerQuarterNote") {
                            secondsPerTick = secondsPerQuarterNote / ticksPerQuarterNote;
                        }
                        // { type: "framesPerSecond", fps: 30, ticksPerFrame: 80}},
                        else if (that.model.midiObject.header.division.type === "framesPerSecond") {
                            fps = that.model.midiObject.header.division.fps;
                            secondsPerTick = 1 / fps / that.model.midiObject.header.division.ticksPerFrame;
                        }

                        var startTime = 0;

                        fluid.each(eventsToProcess, function (singleEvent) {
                            // Process meta events first, as tempo changes are forward-facing, i.e. from this point on.
                            // Empirical secondsPerTick for "hushd": 0.002
                            // Empirical secondsPerTick for "my master": 0.0006
                            // Empirical secondsPerTick for "who are you": 0.00075
                            if (singleEvent.metaEvent) {
                                if (singleEvent.metaEvent.type === "tempo") {
                                    // TODO: Confirm that this is appropriate for `framesPerSecond` time division (if we can
                                    //       ever find an example file in the wild).

                                    // Another way of putting "microseconds per quarter-note" is "24ths of a microsecond per MIDI clock"
                                    secondsPerQuarterNote = singleEvent.metaEvent.value / 1000000;
                                    secondsPerTick = secondsPerQuarterNote / ticksPerQuarterNote;
                                }

                                // TODO: Add support for displaying text and lyrics?
                            }

                            // Time should always move forward for messages, but should only move forward for
                            // meta-events if we are working with format 0 or 2.
                            if (singleEvent.tickDelta && (singleEvent.message || that.model.midiObject.header.format !== 1)) {
                                // Calculate the time delta from the "tick delta".
                                startTime += singleEvent.tickDelta * secondsPerTick;
                                maxTrackTime = Math.max(startTime, maxTrackTime);
                            }

                            if (singleEvent.message) {
                                // TODO: Figure out a saner way to optionally force all notes to one channel.
                                var singleChannelMessage = fluid.extend({}, singleEvent.message, { channel: 0});
                                that.scheduler.schedule({
                                    type: "once",
                                    time: startTime,
                                    callback: function () {
                                        that.applier.change("ticksElapsed", singleEvent.ticksElapsed);
                                        that.events.sendMessage.fire(singleChannelMessage);
                                    }
                                });
                            }
                        });
                    }
                });

                // Run the onscreen clock independently.
                that.currentSeconds = 0;
                var secondsPerFrame = (1 / that.model.fps);
                that.scheduler.schedule({
                    type: "repeat",
                    interval: secondsPerFrame,
                    callback: function () {
                        that.currentSeconds += secondsPerFrame;

                        // Batch the model changes for this timestamp.
                        var transaction = that.applier.initiate();

                        var timeObject = youme.demos.smf.player.timeObjectFromSeconds(that.currentSeconds);

                        // Gate all the other updates conditionally up front.
                        if (timeObject.second !== that.model.second) {
                            transaction.fireChangeRequest({ path: "second", value: timeObject.second});
                        }

                        if (timeObject.minute !== that.model.minute) {
                            transaction.fireChangeRequest({ path: "minute", value: timeObject.minute});
                        }

                        if (timeObject.hour !== that.model.hour) {
                            transaction.fireChangeRequest({ path: "hour", value: timeObject.hour});
                        }

                        var newFrame = (that.model.frame + 1) % that.model.fps;
                        transaction.fireChangeRequest({ path: "frame", value: newFrame});
                        transaction.commit();
                    }
                });

                // Stop playing at the end of the longest track.
                that.scheduler.schedule({
                    type: "once",
                    time: maxTrackTime,
                    callback: function () {
                        that.applier.change("isRunning", false);
                    }
                });

                that.scheduler.start();
            }
            else {
                that.applier.change("isRunning", false);
            }
        }
        else {
            // Clear the current timestamp.
            var transaction = that.applier.initiate();
            transaction.fireChangeRequest({ path: "second", value: 0});
            transaction.fireChangeRequest({ path: "minute", value: 0});
            transaction.fireChangeRequest({ path: "hour", value: 0 });
            transaction.fireChangeRequest({ path: "frame", value: 0});
            transaction.commit();

            try {
                that.scheduler.stop();
            }
            catch (e) {
                // TODO: Ask Colin about the error here.
                fluid.log(fluid.logLevel.WARN, "Error stopping scheduler.");
            }
        }
    };

    youme.demos.smf.player.timeObjectFromSeconds = function (currentSeconds) {
        var timeObject = {};

        timeObject.second = (60 + Math.round(currentSeconds)) % 60;
        timeObject.minute = (60 + Math.floor( currentSeconds / 60)) % 60;
        timeObject.hour   = (24 + Math.floor(currentSeconds / 3600)) % 24;

        return timeObject;
    };

    youme.demos.smf.player.handleFileInputChange = function (that, htmlInputElement) {
        // Stop playing.
        that.applier.change("isRunning", false);

        var file = fluid.get(htmlInputElement, "0.files.0");

        // TODO: Display "select a file" message or something when no file is selected.
        if (file === undefined) {
            that.applier.change("fileName", "No file selected.");
        }
        else {
            that.applier.change("fileName", file.name);

            var promise = file.arrayBuffer();
            promise.then(function (arrayBuffer) {
                var intArray = new Uint8Array(arrayBuffer);
                var midiObject = youme.smf.parseSMFByteArray(intArray);

                var transaction = that.applier.initiate();
                transaction.fireChangeRequest({ path: "midiObject", type: "DELETE"});
                transaction.fireChangeRequest({ path: "midiObject", value: midiObject});
                transaction.commit();
            });
        }
    };

    // Sort in numerical order by "elapsed ticks".
    youme.demos.smf.player.sortByTicksElapsed = function (a, b) {
        if (a.ticksElapsed !== undefined && b.ticksElapsed !== undefined) {
            return a.ticksElapsed - b.ticksElapsed;
        }
        else {
            fluid.fail("There should be no events without elapsed ticks.");
        }
    };
})(fluid);
