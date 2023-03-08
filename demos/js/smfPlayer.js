/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.smf.player", {
        gradeNames: ["youme.templateRenderer", "youme.messageSender"],
        markup: {
            container: "<div class='smf-player'><input type='file' class='smf-player-file-input'/><div class='smf-metadata'></div><div class='playback-footer'><div class='playback-controls'></div><div class='timestamp'></div></div><div><div class='outputs'></div></div>"
        },
        selectors: {
            controls: ".playback-controls",
            fileInput: ".smf-player-file-input",
            outputs: ".outputs",
            smfMetadata: ".smf-metadata",
            timestamp: ".timestamp"
        },

        events: {
            createScheduler: null
        },

        model: {
            // TODO: Display file metadata onscreen.
            fileName: "No file selected",

            // MIDI file information
            midiObject: {},

            smfMetadata: {},

            fps: 30,

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

        components: {
            timestamp: {
                type: "youme.demos.timestamp",
                container: "{that}.dom.timestamp",
                options: {
                    model: {
                        isRunning: "{youme.demos.smf.player}.model.isRunning"
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
                            type: "berg.clock.autoAudioContext",
                            options: {
                                freq: 120
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
            },
            metadata: {
                type: "youme.demos.smf.metadata",
                container: "{that}.dom.smfMetadata",
                options: {
                    model: {
                        midiObject: "{youme.demos.smf.player}.model.midiObject"
                    }
                }
            }
        }
    });

    youme.demos.smf.player.handleStartButtonClick = function (that) {
        // We should only start if a MIDI file has been loaded.
        if (fluid.get(that, "model.midiObject.header")) {
            if (that.scheduler) {
                that.scheduler.stop();
                that.scheduler.clearAll();
            }
            else {
                // Create the scheduler now while we are clothed in divine user intent.
                that.events.createScheduler.fire();
            }

            that.applier.change("isRunning", true);
        }
    };

    youme.demos.smf.player.handleRunningStateChange = function (that) {
        if (that.model.isRunning) {
            if (fluid.get(that, "model.midiObject.tracks.length")) {
                // There are three file types we need to support:
                //
                //   0: single track with meta events generally at timestamp 0.
                //   1: multiple parallel tracks, meta events (including timing) in the first track.
                //   2: multiple parallel tracks with independent timing per track.

                // The default beat time, 0.5 seconds, divided by the default ticks/beat, 60.
                // var secondsPerTick = 0.008333333333333;
                var secondsPerTick = that.model.secondsPerTick;

                // Arbitrary default to line up "ticks per quarter note" with the timestamp.
                var fps = 30;

                if (that.model.midiObject.header.division.type === "ticksPerQuarterNote") {
                    // Until we have tempo information, use the default length of a quarter note, i.e. a half second.
                    secondsPerTick = 0.5 / that.model.midiObject.header.division.resolution;
                }
                // { type: "framesPerSecond", fps: 30, ticksPerFrame: 80}},
                else if (that.model.midiObject.header.division.type === "framesPerSecond") {
                    fps = that.model.midiObject.header.division.fps;
                    secondsPerTick = 1 / fps / that.model.midiObject.header.division.ticksPerFrame;
                }


                // Play format 2 tracks one after the other.
                if (that.model.midiObject.header.format === 2) {
                    var allTrackEvents = [];
                    fluid.each(that.model.midiObject.tracks, function (singleTrack) {
                        allTrackEvents.push(...singleTrack.events);
                    });
                    youme.demos.smf.player.scheduleNextTickEvents(that, allTrackEvents, 1, secondsPerTick);
                }
                // Play everything else in parallel, i.e. all tracks at once.
                else {
                    var tracksPlaying = that.model.midiObject.header.tracks;
                    fluid.each(that.model.midiObject.tracks, function (singleTrack) {
                        var trackEvents = fluid.copy(singleTrack.events);
                        youme.demos.smf.player.scheduleNextTickEvents(that, trackEvents, tracksPlaying, secondsPerTick);
                    });
                }

                that.scheduler.start();
            }
            else {
                that.applier.change("isRunning", false);
            }
        }
        else {
            that.scheduler.stop();

            // Send "All Notes Off" to any outputs. This only works because we force all notes to channel 0.
            that.events.sendMessage.fire({
                type: "control",
                channel: 0,
                number: 123,
                value: 0
            });
        }
    };

    youme.demos.smf.player.scheduleNextTickEvents = function (that, trackEvents, tracksPlaying, secondsPerTick) {
        var eventsThisTick = [];
        var nextEvent = trackEvents.shift();
        eventsThisTick.push(nextEvent);
        while (fluid.get(trackEvents, "0.tickDelta") === 0) {
            eventsThisTick.push(trackEvents.shift());
        }

        var startTime = 0;
        if (nextEvent.tickDelta && (nextEvent.message || that.model.midiObject.header.format !== 1)) {
            // Calculate the time delta from the "tick delta".
            startTime = nextEvent.tickDelta * secondsPerTick;
        }

        // We schedule per "tick delta" and move forward one batch at a time, so that there can only be a handful of
        // events scheduled at any one time.

        // Schedule the processing of the next batch independently of messages so that they don't delay the timing.
        if (trackEvents.length) {
            that.scheduler.schedule({
                type: "once",
                time: startTime,
                callback: function () {
                    youme.demos.smf.player.scheduleNextTickEvents(that, trackEvents, tracksPlaying, secondsPerTick);
                }
            });
        }

        fluid.each(eventsThisTick, function (singleEvent) {
            that.scheduler.schedule({
                type: "once",
                time: startTime,
                callback: function () {
                    if (singleEvent.metaEvent) {
                        if (singleEvent.metaEvent.type === "tempo") {
                            // TODO: Confirm that this is appropriate for `framesPerSecond` time division (if we can
                            //       ever find an example file in the wild).

                            // Another way of putting "microseconds per quarter-note" is "24ths of a microsecond per MIDI clock"
                            var secondsPerQuarterNote = singleEvent.metaEvent.value / 1000000;
                            secondsPerTick = secondsPerQuarterNote / that.model.midiObject.header.division.resolution;
                        }
                        else if (singleEvent.metaEvent.type === "endOfTrack") {
                            tracksPlaying--;
                            // Stop when there are no more tracks playing.
                            if (tracksPlaying === 0) {
                                that.applier.change("isRunning", false);
                                that.scheduler.stop();
                            }
                        }

                        // TODO: Add support for displaying text and lyrics?
                    }

                    if (singleEvent.message) {
                        // TODO: Figure out a saner way to optionally force all notes to one channel.
                        var singleChannelMessage = fluid.extend({}, singleEvent.message, { channel: 0});
                        that.events.sendMessage.fire(singleChannelMessage);
                        // that.events.sendMessage.fire(singleEvent.message);
                    }
                }
            });
        });
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
})(fluid);
