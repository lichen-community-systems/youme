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
                noteCount: 0
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
                    if (message.type === "noteOn" && message.velocity > 0) {
                        trackObject.noteCount++;
                    }
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
            });
            smfMetadata.tracks.push(trackObject);
        });
        return smfMetadata;
    };
})(fluid);
