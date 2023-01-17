/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.console.textareaWithError", {
        gradeNames: ["youme.templateRenderer"],
        markup: {
            container: "<div class='console-textarea-with-error'><textarea class='editor'>%editorString</textarea><div class='error'>%errorString</div></div>"
        },

        model: {
            errorString: false
        },

        selectors: {
            error: ".error",
            editor: ".editor"
        },

        modelRelay: {
            errorStyle: {
                source: "{that}.model.errorString",
                target: "{that}.model.dom.error.class.console-visible"
            },
            errorText: {
                source: "{that}.model.errorString",
                target: "{that}.model.dom.error.text"
            }

            // TODO: Revisit once FLUID-6746 is resolved.
            //
            // This relay doesn't do what we need on startup, i.e. the initial value is lost.
            //
            // See: https://issues.fluidproject.org/browse/FLUID-6746
            //
            // If I comment out the default value above, then the relay works on startup but does not consistently
            // relay changes between the two editors.  Seems like the first one to change "wins", i.e. you can't then
            // switch to the other editor, tweak the value, and send a change back the other way.
            //
            // editorString: {
            //     source: "{that}.model.editorString",
            //     target: "{that}.model.dom.editor.value"
            // }
        },

        modelListeners: {
            editorString: {
                excludeSource: "init",
                this: "{that}.dom.editor",
                method: "val",
                args: ["{that}.model.editorString"]
            }
        },

        invokers: {
            handleEditorChange: {
                funcName: "youme.demos.console.textareaWithError.handleEditorChange",
                args: ["{that}", "{arguments}.0"] // event
            }
        },

        listeners: {
            "onCreate.bindEditorChange": {
                this: "{that}.dom.editor",
                method: "change",
                args: ["{that}.handleEditorChange"]
            }
        }
    });

    youme.demos.console.textareaWithError.handleEditorChange = function (that, event) {
        event.preventDefault();
        that.applier.change("editorString", $(event.currentTarget).val());
    };

    fluid.defaults("youme.demos.console", {
        gradeNames: ["youme.templateRenderer"],
        markup: {
            container: "<div class='console-inner-container'>\n\t<div class='message-converters'><div class='message-hex'></div>\n\t<div class='message-json'></div></div>\n\t<div class='message-output'></div>\n\t<button class='send-button'>Send to Output</button>\n</div>"
        },

        events: {
            sendMessage: null
        },

        selectors: {
            send: ".send-button",
            hex: ".message-hex",
            json: ".message-json",
            output: ".message-output"
        },

        model: {
            json: { type: "noteOn", channel: 0, note: 66, velocity: 77 },
            jsonString: "",
            jsonError: false,
            hexError: false
        },

        modelRelay: {
            source: "hex",
            target: "hexString",
            singleTransform: { type: "youme.demos.console.bytesToHexString" }
        },

        // Do this manually so that we can transmit "valid" payloads and display error feedback in the right place.
        modelListeners: {
            hexString: {
                excludeSource: ["init", "local"],
                funcName: "youme.demos.console.hexToJSON",
                args: ["{that}"]
            },
            json: [
                {
                    funcName: "youme.demos.console.JSONToHex",
                    args: ["{that}"]
                },
                {
                    func: "{that}.applier.change",
                    args: ["jsonString", "@expand:JSON.stringify({that}.model.json, null, 2)"]
                }
            ],
            jsonString: {
                // excludeSource: "local",
                funcName: "youme.demos.console.parseString",
                args: ["{that}"]
            }
        },

        invokers: {
            handleSendButtonClick: {
                funcName: "youme.demos.console.handleSendButtonClick",
                args: ["{that}", "{arguments}.0"] // event
            }
        },

        listeners: {
            "onCreate.bindSendButton": {
                this: "{that}.dom.send",
                method: "click",
                args: ["{that}.handleSendButtonClick"]
            }
        },

        components: {
            hex: {
                type: "youme.demos.console.textareaWithError",
                container: "{that}.dom.hex",
                options: {
                    model: {
                        errorString: "{console}.model.hexError",
                        editorString: "{console}.model.hexString"
                    }
                }
            },
            json: {
                type: "youme.demos.console.textareaWithError",
                container: "{that}.dom.json",
                options: {
                    model: {
                        editorString: "{console}.model.jsonString",
                        errorString: "{console}.model.jsonError"
                    }
                }
            },
            output: {
                type: "youme.portSelectorView.output",
                container: "{that}.dom.output",
                options: {
                    desiredPortSpec: {
                        name: "IAC Driver Bus 1"
                    },
                    listeners: {
                        "{console}.events.sendMessage": "{that}.events.sendMessage.fire"
                    }
                }
            }
        }
    });

    youme.demos.console.parseString = function (that) {
        try {
            var json = JSON.parse(that.model.jsonString);
            fluid.replaceModelValue(that.applier, "json", json);
        }
        catch (error) {
            that.applier.change("jsonError", error);
        }
    };

    youme.demos.console.handleSendButtonClick = function (that, event) {
        event.preventDefault();
        that.events.sendMessage.fire(that.model.json);
    };

    youme.demos.console.hexStringToBytes = function (hexString) {
        // We have to check the validity of the overall pattern here, because trailing nonsense is ignored, i.e.
        // parseInt("0x4Z") = 4, where parseInt("0xGG") = NaN.
        if (typeof hexString !== "string") {
            throw ("Hex input must be a string.");
        }
        else if (hexString.length === 0) {
            throw ("Hex input cannot be empty.");
        }
        else if (!hexString.match(/^[ 0-9a-fA-F]+$/)) {
            throw ("Hex string must contain bytes (i.e. B0) separated by spaces.");
        }
        else {
            var byteStrings = hexString.split(" ");
            var bytes = fluid.transform(byteStrings, youme.demos.console.hexStringToByte);
            return bytes;
        }
    };

    youme.demos.console.hexStringToByte = function (hexString) {
        var prefixedHexString = hexString.startsWith("0x") ? hexString : "0x" + hexString;
        var hexNumber = parseInt(prefixedHexString, 16);
        if (isNaN(hexNumber)) {
            throw ("Invalid Hex String: '" + hexString + "'.");
        }
        else {
            return hexNumber;
        }
    };

    youme.demos.console.bytesToHexString = function (bytes) {
        var stringSegs = [];
        fluid.each(bytes, function (byte) {
            stringSegs.push(byte.toString(16).replace(/^0x/).toUpperCase().padStart(2, "0"));
        });
        return stringSegs.join(" ");
    };

    youme.demos.console.hexToJSON = function (that) {
        that.applier.change("hexError", false);
        try {
            var bytes = youme.demos.console.hexStringToBytes(that.model.hexString);
            var convertedJSON = youme.read(bytes);

            // If we are replacing the JSON with fresh data, we should clear any previous errors.
            that.applier.change("jsonError", false);

            fluid.replaceModelValue(that.applier, "json", convertedJSON);
        }
        catch (error) {
            that.applier.change("hexError", error);
        }
    };

    youme.demos.console.JSONToHex = function (that) {
        that.applier.change("jsonError", false);
        try {
            var convertedHex = youme.write(that.model.json);

            // If we are replacing the hex with fresh data, we should clear any previous errors.
            that.applier.change("hexError", false);

            fluid.replaceModelValue(that.applier, "hex", convertedHex);
        }
        catch (error) {
            that.applier.change("jsonError", error);
        }
    };
})(fluid);
