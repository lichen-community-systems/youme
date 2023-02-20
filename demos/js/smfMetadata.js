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
            duration: 0
        };

        var allEvents = [];
        fluid.each(midiObject.tracks, function (singleTrack) {
            allEvents.push(...singleTrack.events);
        });
        if (midiObject.header.format !== 2) {
            allEvents.sort(youme.demos.smf.metadata.sortByTicksElapsed);
        }

        var secondsPerTick =  0.5 / midiObject.header.division.resolution;
        fluid.each(allEvents, function (singleEvent) {
            if (singleEvent.tickDelta && (singleEvent.message || (singleEvent.metaEvent && midiObject.header.format !== 1))) {
                var secondsDelta = singleEvent.tickDelta * secondsPerTick;

                // Track the smallest non-zero pause so that we can understand how fast a clock we need.
                timingObject.smallestPauseSeconds = timingObject.smallestPauseSeconds ? Math.min(timingObject.smallestPauseSeconds, secondsDelta) : secondsDelta;

                timingObject.duration += secondsDelta;
            }

            // Update the timing if needed.
            if (singleEvent.metaEvent && singleEvent.metaEvent.type === "tempo") {
                var secondsPerQuarterNote = singleEvent.metaEvent.value / 1000000;
                secondsPerTick = secondsPerQuarterNote / midiObject.header.division.resolution;
            }
        });

        return timingObject;
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
