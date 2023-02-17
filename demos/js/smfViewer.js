/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.smf.viewer", {
        gradeNames: ["youme.templateRenderer"],

        markup: {
            container: "<div><input type='file' class='smf-demo-file-input'/>\n<h3>Metadata</h3>\n</h3><div class='smf-metadata'><p></p></div>\n<div class='smf-demo-error'></div><h3>JSON</h3>\n</h3><pre class='smf-demo-output'>%output</pre></div>"
        },

        model: {
            parseError: false,
            output: "Please select a MIDI file to view its contents."
        },

        selectors: {
            error: ".smf-demo-error",
            input: ".smf-demo-file-input",
            output: ".smf-demo-output",
            smfMetadata: ".smf-metadata"
        },

        modelRelay: {
            errorStyle: {
                source: "{that}.model.errorString",
                target: "{that}.model.dom.error.class.has-error"
            },
            output: {
                source: "{that}.model.output",
                target: "{that}.model.dom.output.text"
            }
        },

        modelListeners: {
            errorString: {
                funcName: "youme.demos.smf.viewer.displayErrorString",
                args: ["{that}"]
            }
        },

        invokers: {
            handleInputChange: {
                funcName: "youme.demos.smf.viewer.handleInputChange",
                args: ["{that}", "{that}.dom.input"] // HTMLInputElement
            }
        },

        listeners: {
            "onCreate.bindInputChange": {
                this: "{that}.dom.input",
                method: "change",
                args: "{that}.handleInputChange"
            }
        },

        components: {
            metadata: {
                type: "youme.demos.smf.metadata",
                container: "{that}.dom.smfMetadata",
                options: {
                    model: {
                        midiObject: "{youme.demos.smf.viewer}.model.midiObject"
                    }
                }
            }
        }
    });

    youme.demos.smf.viewer.displayErrorString = function (that) {
        var errorElement = that.locate("error");
        if (errorElement) {
            errorElement.html(that.model.errorString);
        }
    };

    youme.demos.smf.viewer.handleInputChange = function (that, htmlInputElement) {
        that.applier.change("errorString", false);
        var file = fluid.get(htmlInputElement, "0.files.0");
        if (file === undefined) {
            that.applier.change("output", "Please select a MIDI file to view its contents.");
        }
        else {
            that.applier.change("output", "Parsing file content...");
            var promise = file.arrayBuffer();
            promise.then(function (arrayBuffer) {
                var intArray = new Uint8Array(arrayBuffer);
                var midiObject = youme.smf.parseSMFByteArray(intArray);

                var transaction = that.applier.initiate();
                transaction.fireChangeRequest({ path: "midiObject", type: "DELETE"});
                transaction.fireChangeRequest({ path: "midiObject", value: midiObject});

                if (midiObject.errors.length) {
                    var errorString = "<p>" + midiObject.errors.join("</p></p>") + "</p>";
                    transaction.fireChangeRequest({ path: "errorString", value: errorString});
                    transaction.fireChangeRequest({ path: "output", value: midiObject.error});
                }
                else {
                    transaction.fireChangeRequest({ path: "output", value: JSON.stringify(midiObject, null, 2)});
                }

                transaction.commit();
            });
        }
    };
})(fluid);
