/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.smf", {
        gradeNames: ["youme.templateRenderer"],

        markup: {
            container: "<div><input type='file' class='smf-demo-file-input'/>\n<hr/>\n<div class='smf-demo-error'></div><pre class='smf-demo-output'>%output</pre></div>"
        },

        model: {
            parseError: false,
            output: "Please select a MIDI file to view its contents."
        },

        selectors: {
            error: ".smf-demo-error",
            input: ".smf-demo-file-input",
            output: ".smf-demo-output"
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
                funcName: "youme.demos.smf.displayErrorString",
                args: ["{that}"]
            }
        },

        invokers: {
            handleInputChange: {
                funcName: "youme.demos.smf.handleInputChange",
                args: ["{that}", "{that}.dom.input"] // HTMLInputElement
            }
        },

        listeners: {
            "onCreate.bindInputChange": {
                this: "{that}.dom.input",
                method: "change",
                args: "{that}.handleInputChange"
            }
        }
    });

    youme.demos.smf.displayErrorString = function (that) {
        var errorElement = that.locate("error");
        if (errorElement) {
            errorElement.html(that.model.errorString);
        }
    };

    youme.demos.smf.handleInputChange = function (that, htmlInputElement) {
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
                if (midiObject.errors.length) {
                    var errorString = "<p>" + midiObject.errors.join("</p></p>") + "</p>";
                    that.applier.change("errorString", errorString);
                    that.applier.change("output", midiObject.error);
                }
                that.applier.change("output", JSON.stringify(midiObject, null, 2));
            });
        }
    };
})(fluid);
