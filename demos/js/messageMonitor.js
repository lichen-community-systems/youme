/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.demos.messageMonitor.logger", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            loggedMessages: []
        },
        templates: {
            activeSense: "%timestamp - %port.name - %message.type: (no content to display)",
            aftertouch: "%timestamp - %port.name - %message.type: channel %message.channel, pressure: %message.pressure, note: %message.note",
            clock: "%timestamp - %port.name - %message.type: (no content to display)",
            continue: "%timestamp - %port.name - %message.type: (no content to display)",
            control: "%timestamp - %port.name - %message.type: channel %message.channel, number: %message.number, value: %message.value",
            message: "%timestamp - %port.name - %message.type: channel %message.channel",
            noteOn: "%timestamp - %port.name - %message.type: channel %message.channel, note: %message.note, velocity: %message.velocity",
            noteOff: "{that}.options.templates.noteOn",
            pitchbend: "%timestamp - %port.name - %message.type: channel %message.channel, value: %message.value",
            program: "%timestamp - %port.name - %message.type: channel %message.channel, program: %message.program",
            raw: "%timestamp - %port.name - %message.type: (no content to display)",
            reset: "%timestamp - %port.name - %message.type: (no content to display)",
            songPointer: "%timestamp - %port.name - %message.type: value: %message.value",
            songSelect: "%timestamp - %port.name - %message.type: value: %message.value",
            start: "%timestamp - %port.name - %message.type: (no content to display)",
            stop: "%timestamp - %port.name - %message.type: (no content to display)",
            sysex: "%timestamp - %port.name - %message.type: (contents not displayed)",
            tuneRequest: "%port.name - %message.type: (no content to display)"
        },

        modelListeners: {
            loggedMessages: {
                funcName: "youme.demos.messageMonitor.logger.appendLastMessage",
                args: ["{that}.container", "{that}.model.loggedMessages", "{that}.options.templates"] // container, loggedMessages
            }
        }
    });

    youme.demos.messageMonitor.logger.appendLastMessage = function (container, loggedMessages, templates) {
        if (loggedMessages.length) {
            var lastMessage = loggedMessages[loggedMessages.length - 1];
            var template = templates[lastMessage.message.type] || templates.message;
            var messageContent = fluid.stringTemplate(template, lastMessage);
            var childElement = $("<div class='message-monitor-log-message'></div>");
            childElement.text(messageContent);
            container.prepend(childElement);
        }
        else {
            container.html("");
        }
    };

    fluid.defaults("youme.demos.messageMonitor", {
        gradeNames: ["youme.templateRenderer"],
        markup: {
            container: "<div class='message-monitor-inner-container'><div class='message-monitor-inputs'></div><div class='message-monitor-log'></div><button class='message-monitor-reset-button'>Clear Log</button></div>"
        },

        selectors: {
            inputs: ".message-monitor-inputs",
            log: ".message-monitor-log",
            reset: ".message-monitor-reset-button"
        },

        model: {
            loggedMessages: []
        },

        invokers: {
            resetLog: {
                funcName: "fluid.replaceModelValue",
                args: ["{that}.applier", "loggedMessages", []]
            }
        },

        components: {
            inputs: {
                type: "youme.multiPortSelectorView.inputs",
                container: "{that}.dom.inputs",
                options: {
                    model: {
                        portSpecs: [{
                            name: "Launchpad Pro .+ (MIDI|Standalone Port)"
                        }]
                    },
                    components: {
                        portConnector: {
                            options: {
                                dynamicComponents: {
                                    connection: {
                                        options: {
                                            // Listen at this level so that we can determine which port/device sent the message.
                                            listeners: {
                                                "onMessage.log": {
                                                    funcName: "youme.demos.messageMonitor.logMessage",
                                                    args: ["{youme.demos.messageMonitor}", "{that}", "{arguments}.0"] // messageMonitor, connection, message
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            log: {
                type: "youme.demos.messageMonitor.logger",
                container: "{that}.dom.log",
                options: {
                    model: {
                        loggedMessages: "{youme.demos.messageMonitor}.model.loggedMessages"
                    }
                }
            },
            resetButton: {
                type: "fluid.viewComponent",
                container: "{that}.dom.reset",
                options: {
                    listeners: {
                        "onCreate.bind": {
                            this: "{that}.container",
                            method: "click",
                            args: ["{youme.demos.messageMonitor}.resetLog"]
                        }
                    }
                }
            }
        }
    });

    youme.demos.messageMonitor.logMessage = function (messageMonitor, connection, message) {
        var date = new Date();
        var timestampOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            fractionalSecondDigits: 2
        };
        var timestamp = date.toLocaleTimeString(navigator.language, timestampOptions);
        var toLog = { timestamp: timestamp, port: connection.model.port, message: message};

        // Incrementally add entries rather than deleting and recreating every time.
        var index = messageMonitor.model.loggedMessages.length;
        messageMonitor.applier.change(["loggedMessages", index], toLog);
    };
})(fluid);
