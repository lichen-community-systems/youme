/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.smf.metadata", {
        gradeNames: ["youme.templateRenderer"],
        markup: {
            container: "<div class='smf-metadata-container'><div class='metadata-header'><div class='name'></div><div class='copyright'></div></div><div class='text'></div></div>"
        },
        selectors: {
            copyright: ".copyright",
            name: ".name",
            text: ".text"
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

            // Relay metadata to onscreen elements.
            copyright: {
                source: "smfMetadata.copyright",
                target: "{that}.model.dom.copyright.text"
            },
            name: {
                source: "smfMetadata.name",
                target: "{that}.model.dom.name.text"
            },
            text: {
                source: "smfMetadata.text",
                target: "{that}.model.dom.text.text"
            }
        }
        // TODO: Dynamic components for individual tracks.
    });

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
            var trackTiming = youme.demos.smf.metadata.extractTrackTiming(midiObject, eventsToEvaluate);
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

    youme.demos.smf.metadata.extractTrackTiming = function (midiObject, eventsToEvaluate) {
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
            }
        });
        return trackTiming;
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
