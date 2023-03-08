/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.smf.metadata", {
        gradeNames: ["fluid.containerRenderingView"],
        markup: {
            container: "<div class='smf-metadata-container'><div class='metadata-header'><div class='name'><div class='format'></div></div><div class='copyright'></div><div class='length'></div><div class='text'></div></div><ul class='tracks'></ul></div>",
            trackItem: "<li>Track %index: %name%bpms</li>\n"
        },
        selectors: {
            copyright: ".copyright",
            format: ".format",
            length: ".length",
            name: ".name",
            text: ".text",
            tracks: ".tracks"
        },
        invokers: {
            renderMarkup: {
                funcName: "youme.demos.smf.metadata.render",
                args: ["{that}", "{that}.options.markup.container"] // containerTemplate
            },
            renderTracks: {
                funcName: "youme.demos.smf.metadata.renderTracks",
                args: ["{that}", "{that}.options.markup.trackItem" ] // trackTemplate
            }
        },
        model: {
            midiObject: {},
            smfMetadata: {}
        },
        modelRelay: {
            // Transform MIDI object into metadata.
            extractMetadata: {
                source: "midiObject",
                singleTransform: { type: "youme.demos.smf.metadata.extractSMFMetadata"},
                target: "smfMetadata"
            },

            // Relay simple metadata to onscreen elements.
            copyright: {
                source: "smfMetadata.copyright",
                target: "{that}.model.dom.copyright.text"
            },
            format: {
                source: "smfMetadata.format",
                target: "{that}.model.dom.format.text",
                singleTransform: {
                    type: "youme.demos.smf.metadata.formatToWords"
                }
            },
            length: {
                source: "smfMetadata.timing.duration",
                target: "{that}.model.dom.length.text",
                singleTransform: {
                    type: "youme.demos.smf.metadata.secondsToWords"
                }
            },
            name: {
                source: "smfMetadata.name",
                target: "{that}.model.dom.name.text"
            },
            text: {
                source: "smfMetadata.text",
                target: "{that}.model.dom.text.text"
            }
        },
        modelListeners: {
            selectBoxRefresh: {
                path: ["smfMetadata", "tracks"],
                this: "{that}.dom.tracks",
                method: "html",
                args: ["@expand:{that}.renderTracks()"]
            }
        }
    });

    youme.demos.smf.metadata.formats = [
        "Format 0, single track file, timing and metadata in first track.",
        "Format 1, multi-track, timing and metadata in first track.",
        "Format 2, multi-track, timing and metadata in each track."
    ];

    // For whatever reason, valueMapper didn't seem to work as a singleTransform, so I made a small function.
    youme.demos.smf.metadata.formatToWords = function (rawFormat) {
        var format = parseInt(rawFormat);
        return youme.demos.smf.metadata.formats[format] || "Unknown format";
    };

    youme.demos.smf.metadata.secondsToWords = function (rawSeconds) {
        var minutes = Math.floor(rawSeconds / 60);
        var seconds = Math.round(rawSeconds % 60);
        var words = "";
        if (minutes) {
            words += minutes + " minute";
            if (minutes > 1) { words += "s"; }
        }
        if (seconds) {
            if (words.length) {
                words += ", ";
            }
            words += seconds + " second";
            if (seconds !== 1) { words += "s"; }
        }
        return words;
    };

    youme.demos.smf.metadata.extractSMFMetadata = function (midiObject) {
        var smfMetadata = fluid.extend({}, midiObject.header);
        smfMetadata.tracks = [];
        var metaDataPropertiesToTrack = ["name", "copyright", "text"];
        fluid.each(midiObject.tracks, function (singleTrack, trackNumber) {
            var trackObject = {
                messagesByType: {},
                metaEventsByType: {}
            };

            if (midiObject.header.format === 1) {
                trackObject.name = "Metadata and tempo map track.";
            }
            else {
                trackObject.name = "Track " + trackNumber + ", (untitled)";
            }

            fluid.each(singleTrack.events, function (singleEvent) {
                var message = fluid.get(singleEvent, "message");
                var metaEvent = fluid.get(singleEvent, "metaEvent");

                if (message) {
                    var currentMessageTypeCount = fluid.get(trackObject, ["messagesByType", message.type]) || 0;
                    fluid.set(trackObject, ["messagesByType", message.type], currentMessageTypeCount + 1);
                }
                else if (metaEvent) {
                    var currentMetaEventTypeCount = fluid.get(trackObject, ["eventsByType", metaEvent.type]) || 0;
                    fluid.set(trackObject, ["metaEventsByType", metaEvent.type], currentMetaEventTypeCount + 1);
                }

                if (metaEvent) {
                    if (metaDataPropertiesToTrack.indexOf(metaEvent.type) !== -1) {
                        if (trackNumber === 0 && midiObject.header.format !== 2) {
                            smfMetadata[metaEvent.type] = metaEvent.value;
                        }
                        else {
                            trackObject[metaEvent.type] = metaEvent.value;
                        }
                    }
                }
            }, singleTrack.events);
            smfMetadata.tracks.push(trackObject);
        });

        if (midiObject.header) {
            var timingObject = youme.demos.smf.metadata.extractTiming(midiObject);
            smfMetadata.timing = timingObject;
            fluid.each(timingObject.tracks, function (singleTrackTiming, trackIndex) {
                fluid.set(smfMetadata, ["tracks", trackIndex, "timing"], singleTrackTiming);
            });
        }

        return smfMetadata;
    };

    // Calculate duration of song.
    youme.demos.smf.metadata.extractTiming = function (midiObject) {
        var timingObject = {
            duration: 0,
            tracks: []
        };

        var sharedEvents = midiObject.tracks[0].events;
        fluid.each(midiObject.tracks, function (singleTrack, trackIndex) {
            var eventsToEvaluate = singleTrack.events;
            if (midiObject.header.format === 1 && trackIndex > 0) {
                eventsToEvaluate = singleTrack.events.concat(sharedEvents).sort(youme.demos.smf.metadata.sortByTicksElapsed);
            }
            var trackBpms = midiObject.header.format !== 1 || trackIndex === 0;
            var trackTiming = youme.demos.smf.metadata.extractTrackTiming(midiObject, eventsToEvaluate, trackBpms);
            timingObject.tracks[trackIndex] = trackTiming;
        });

        // If there's only one track, use its data as the summary.
        timingObject.duration = timingObject.tracks[0].duration;
        timingObject.smallestPauseSeconds = timingObject.tracks[0].smallestPauseSeconds || 999999999;

        if (midiObject.header.format !== 0) {
            fluid.each(timingObject.tracks, function (singleTrackTiming) {
                // Tracks (like metadata tracks) might fire all events at once, in which case there's no pause to track.
                if (singleTrackTiming.smallestPauseSeconds) {
                    timingObject.smallestPauseSeconds = Math.min(timingObject.smallestPauseSeconds, singleTrackTiming.smallestPauseSeconds);
                }

                // In format 1, we use the tempo from track 0 and check the length of the remaining tracks independently.
                if (midiObject.header.format === 1) {
                    timingObject.duration = Math.max(timingObject.duration, singleTrackTiming.duration);
                }
                // For format 2, the running time is a summary of all the times
                else if (midiObject.header.format === 2) {
                    timingObject.duration += singleTrackTiming.duration;
                }
            });
        }

        return timingObject;
    };

    youme.demos.smf.metadata.extractTrackTiming = function (midiObject, eventsToEvaluate, trackBpms) {
        var trackTiming = { duration: 0 };
        var secondsPerTick =  0.5 / midiObject.header.division.resolution;
        fluid.each(eventsToEvaluate, function (singleEvent) {
            if (singleEvent.tickDelta && (singleEvent.message || (singleEvent.metaEvent && midiObject.header.format !== 1))) {
                var secondsDelta = singleEvent.tickDelta * secondsPerTick;

                // Track the smallest non-zero pause so that we can understand how fast a clock we need.
                trackTiming.smallestPauseSeconds = trackTiming.smallestPauseSeconds ? Math.min(trackTiming.smallestPauseSeconds, secondsDelta) : secondsDelta;

                trackTiming.duration += secondsDelta;
            }

            // Update the timing if needed.
            if (singleEvent.metaEvent && singleEvent.metaEvent.type === "tempo") {
                var secondsPerQuarterNote = singleEvent.metaEvent.value / 1000000;
                secondsPerTick = secondsPerQuarterNote / midiObject.header.division.resolution;

                if (trackBpms) {
                    // Hold onto the BPM values.
                    var bpm = Math.round(60 / secondsPerQuarterNote);
                    if (trackTiming.bpms) {
                        trackTiming.bpms.push(bpm);
                    }
                    else {
                        trackTiming.bpms = [bpm];
                    }
                }
            }
        });
        return trackTiming;
    };

    youme.demos.smf.metadata.render = function (that, containerTemplate) {
        var trackContent = that.renderTracks();

        var mergedContainerVariables = fluid.extend({}, that.model, { trackContent: trackContent});
        var renderedContent = fluid.stringTemplate(containerTemplate, mergedContainerVariables);
        return renderedContent;
    };

    youme.demos.smf.metadata.renderTracks = function (that, trackTemplate) {
        var trackContent = "";
        var trackModelData = fluid.get(that, "model.smfMetadata.tracks");
        fluid.each(trackModelData, function (trackItem, trackIndex) {
            var bpms = "";
            if (trackItem.timing.bpms) {
                bpms += " (";
                var lowest = 1000;
                var highest = 0;
                fluid.each(trackItem.timing.bpms, function (singleBpm) {
                    var bpm = Math.round(singleBpm);
                    lowest = Math.min(lowest, bpm);
                    highest = Math.max(highest, bpm);
                });
                if (lowest === highest) {
                    bpms += lowest;
                }
                else {
                    bpms += lowest + "-" + highest;
                }
                bpms += " BPM)";
            }
            trackContent += fluid.stringTemplate(trackTemplate, { name: trackItem.name, index: trackIndex, bpms: bpms});
        });
        return trackContent;
    };

    // Sort in numerical order by "elapsed ticks".
    youme.demos.smf.metadata.sortByTicksElapsed = function (a, b) {
        if (a.ticksElapsed !== undefined && b.ticksElapsed !== undefined) {
            return a.ticksElapsed - b.ticksElapsed;
        }
        else {
            fluid.fail("There should be no events without elapsed ticks.");
        }
    };
})(fluid);
