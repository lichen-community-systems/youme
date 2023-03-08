/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    fluid.defaults("youme.tests.webMidiMock", {
        gradeNames: ["fluid.modelComponent"],

        rejectAccess: false,

        inputSpecs: {},
        outputSpecs: {},

        portDefaults: {
            connection: "closed",
            state: "disconnected"
        },

        events: {
            statechange: null
        },

        members: {
            existingRequestMIDIAccess: null,
            calls: {
                requestMIDIAccess: []
            },
            accessEventTargets: [],
            inputs: {
                expander: {
                    funcName: "youme.tests.webMidiMock.expandPortSpecMap",
                    args: ["{that}.options.inputSpecs", "{that}.generateMockPort"]
                }
            },
            outputs: {
                expander: {
                    funcName: "youme.tests.webMidiMock.expandPortSpecMap",
                    args: ["{that}.options.outputSpecs", "{that}.generateMockPort"]
                }
            }
        },
        invokers: {
            addPort: {
                funcName: "youme.tests.webMidiMock.addPort",
                args: ["{that}", "{arguments}.0"] // portSpec
            },
            closePort: {
                funcName: "youme.tests.webMidiMock.changePortProperty",
                args: ["{that}", "{arguments}.0", "connection", "closed"] // portSpec, propertyKey, value
            },
            connectPort: {
                funcName: "youme.tests.webMidiMock.changePortProperty",
                args: ["{that}", "{arguments}.0", "state", "connected"] // portSpec, propertyKey, value
            },
            disconnectPort: {
                funcName: "youme.tests.webMidiMock.changePortProperty",
                args: ["{that}", "{arguments}.0", "state", "disconnected"] // portSpec, propertyKey, value
            },
            findPorts: {
                funcName: "youme.tests.webMidiMock.findPorts",
                args: ["@expand:youme.tests.webMidiMock.mapToArray({that}.inputs)", "@expand:youme.tests.webMidiMock.mapToArray({that}.outputs)", "{arguments}.0"] // inputs, outputs, portSpec
            },
            generateMockPort: {
                funcName: "youme.tests.webMidiMock.generateMockPort",
                args: ["{that}.options.portDefaults", "{arguments}.0"] // portDefaults, portSpec, shouldReject
            },
            openPort: {
                funcName: "youme.tests.webMidiMock.changePortProperty",
                args: ["{that}", "{arguments}.0", "connection", "open"] // portSpec, propertyKey, value
            },
            requestMIDIAccess: {
                funcName: "youme.tests.webMidiMock.requestMIDIAccess",
                args: ["{that}", "{arguments}.0"] // midiAccessOptions
            }
        },
        listeners: {
            "onCreate.replaceRequestMIDIAccess": {
                funcName: "youme.tests.webMidiMock.replaceRequestMIDIAccess",
                args: ["{that}"]
            },
            "onDestroy.restoreRequestMIDIAccess": {
                funcName: "youme.tests.webMidiMock.restoreRequestMIDIAccess",
                args: ["{that}"]
            },
            "statechange.notifyAccessEventTargets": {
                funcName: "youme.tests.webMidiMock.notifyAccessEventTargets",
                args: ["{that}", "{arguments}.0"] // portChanged
            }
        }
    });

    youme.tests.webMidiMock.replaceRequestMIDIAccess = function (that) {
        that.existingRequestMIDIAccess = navigator.requestMIDIAccess;
        navigator.requestMIDIAccess = that.requestMIDIAccess;
    };

    youme.tests.webMidiMock.restoreRequestMIDIAccess = function (that) {
        navigator.requestMIDIAccess = that.existingRequestMIDIAccess;
    };

    youme.tests.webMidiMock.mapToArray = function (map) {
        return [...map];
    };

    youme.tests.webMidiMock.findPorts = function (inputs, outputs, portSpec) {
        var inputPorts = youme.findPorts(inputs, portSpec);
        var outputPorts = youme.findPorts(outputs, portSpec);
        return inputPorts.concat(outputPorts);
    };

    youme.tests.webMidiMock.expandPortSpecMap = function (portSpecMap, portExpander) {
        var expanded = new Map();
        fluid.each(portSpecMap, function (portSpec) {
            if (portSpec.id && portSpec.type) {
                expanded.set(portSpec.id, portExpander(portSpec));
            }
            else {
                fluid.fail("Cannot expand port definition: " + JSON.stringify(portSpec));
            }
        });
        return expanded;
    };

    /**
     * @callback ListenerFunction
     * @param {Object} message - The message received by the event target.
     */

    /**
     * @typedef AddEventListener
     * @type {Function}
     * @param {String} eventType - The type of event we want to listen for.
     * @param {ListenerFunction} listener - The function to call when a matching event is received.
     */

    /**
     * @typedef DispatchEvent
     * @type {Function}
     * @param {Event} event - The event to dispatch.
     */

    /**
     * @typedef MIDIAccess
     * @type {Object}
     * @property {Boolean} sysexEnabled - Whether we can send/receive sysex messages using this access object.
     * @property {Map<MIDIInputPort>} inputs - A read-only map-like structure containing available inputs.
     * @property {Map<MIDIOutputPort>} outputs - A read-only map-like structure containing available outputs.
     * @property {Function | null} onstatechange - A function to call when ports change (connect, disconnect, etc.)
     * @property {AddEventListener} addEventListener - Add a listener for events the access object receives.
     * @property {DispatchEvent} dispatchEvent - Dispatch an event to the access object.
     */

    /**
     *
     * @typedef MIDIAccessOptions
     * @type {Object}
     * @property {Boolean} sysex - Whether to request the ability to send / receive sysex messages.
     * @property {Boolean} software - Whether to request the ability to send / receive from "software" instruments.
     *
     */

    /**
     *
     * A mock for navigator.requestMIDIAccess({ sysex: boolean, software: boolean })
     *
     * See: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess
     *
     * @param {Object} that - The `youme.tests.webMidiMock` component.
     * @param {MIDIAccessOptions} midiAccessOptions - The options to use when requesting access.
     * @return {Promise<MIDIAccess>} - A Promise that will resolve with a MIDIAccess instance.
     *
     */
    youme.tests.webMidiMock.requestMIDIAccess = function (that, midiAccessOptions) {
        // We only have one argument, but we store them in the same way as other call registers.
        that.calls.requestMIDIAccess.push(fluid.makeArray(midiAccessOptions));

        var promise = new Promise(function (resolve, reject) {
            if (that.options.rejectAccess) {
                reject(new DOMException("requestMIDIAccess rejected to test error handling."));
            }
            else {
                var sysexEnabled = fluid.get(midiAccessOptions, "sysex") || false;

                // required in order to be able to handle addEventListener calls.
                var accessEventTarget = new EventTarget();
                accessEventTarget.sysexEnabled = sysexEnabled;
                accessEventTarget.inputs = that.inputs;
                accessEventTarget.outputs = that.outputs;

                that.accessEventTargets.push(accessEventTarget);

                accessEventTarget.addEventListener("statechange", function (event) {
                    if (typeof accessEventTarget.onstatechange === "function") {
                        accessEventTarget.onstatechange(event);
                    }
                });

                resolve(accessEventTarget);
            }
        });

        return promise;
    };

    /**
     * @typedef MIDIPortMock
     * @type {MIDIPort}
     * @property {CallRegister} calls - A register of calls made to each function, including the arguments supplied.
     */

    /** @typedef MIDIInputMock
     * @type {MIDIInput}
     * @property {CallRegister} calls - A register of calls made to each function, including the arguments supplied.
     */

    /**
     * @typedef MIDIOutputMock
     * @type {MIDIOutput}
     * @property {CallRegister} calls - A register of calls made to each function, including the arguments supplied.
     */

    /**
     *
     * Generate a mock of a port from a port definition. See:
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/MIDIPort
     * https://developer.mozilla.org/en-US/docs/Web/API/MIDIInput
     * https://developer.mozilla.org/en-US/docs/Web/API/MIDIOutput
     *
     * Each mock instance includes a register of calls made to methods in the above API. For example, from the
     * perspective of an output port mock, `{port}.calls.sent.length` represents the number of times the `sent` method
     * was called, and `{port}.calls.sent[0]` represents the arguments passed for the first call to the `sent` method.
     *
     * From the perspective of the enclosing `youme.tests.webMidiMock` component, the same information would be found at
     * `{that}.model.outputs.{id}.calls.sent.length` and `{that}.model.outputs.{id}.calls.sent[0]`.
     *
     * @param {Object} portDefaults - The defaults for the new port mock.
     * @param {PortSpec} portSpec - The port definition.
     * @param {Boolean} shouldReject - If `true`, `open` and `close` return a rejected promise instead of a resolved one.
     * @return {MIDIInputMock|MIDIOutputMock} - The new port mock.
     */
    youme.tests.webMidiMock.generateMockPort = function (portDefaults, portSpec, shouldReject) {
        // Needed to ensure that we can listen to 'onmidimessage'.
        var port = new EventTarget();
        var defaults = fluid.copy(portDefaults);
        var toMerge = fluid.extend(defaults, portSpec, { calls: { send: [], clear: [], open: [], close: []} });
        fluid.each(toMerge, function (value, key) {
            port[key] = value;
        });

        var functionsToMock = ["open", "close"];
        if (port.type === "output") {
            functionsToMock = functionsToMock.concat(["send", "clear"]);
        }

        fluid.each(functionsToMock, function (fnName) {
            port[fnName] = function () {
                port.calls[fnName].push(fluid.makeArray(arguments));
                switch (fnName) {
                    case "open":
                        port.connection = "open";
                        break;
                    case "close":
                        port.connection = "closed";
                        break;
                    default:
                }
                // "close" and "open" return promises, "send", and "clear" don't.
                if (fnName === "close" || fnName === "open") {
                    return shouldReject ? Promise.reject() : Promise.resolve();
                }
            };
        });

        // Listener to support adding handler by setting onmidimessage
        port.addEventListener("midimessage", function (event) {
            if (typeof port.onmidimessage === "function") {
                port.onmidimessage(event);
            }
        }, false);

        return port;
    };

    youme.tests.webMidiMock.addPort = function (that, portSpec) {
        if (portSpec.id && portSpec.type) {
            var mapKey = portSpec.type === "input" ? "inputs" : "outputs";
            var newPort = that.generateMockPort(portSpec);
            that[mapKey].set(portSpec.id, newPort);

            that.events.statechange.fire(newPort);
        }
        else {
            fluid.fail("Attempted to add invalid port: " + JSON.stringify(portSpec));
        }
    };

    youme.tests.webMidiMock.changePortProperty = function (that, portSpec, propertyKey, value) {
        if (portSpec.id && portSpec.type) {
            var mapKey = portSpec.type === "input" ? "inputs" : "outputs";
            var existingPort = that[mapKey].get(portSpec.id);
            fluid.set(existingPort, propertyKey, value);

            that.events.statechange.fire(existingPort);
        }
        else {
            fluid.fail("Attempted to update invalid port: " + JSON.stringify(portSpec));
        }
    };

    youme.tests.webMidiMock.notifyAccessEventTargets = function (that, portChanged) {
        var event = new Event("statechange", portChanged);
        fluid.each(that.accessEventTargets, function (accessEventTarget) {
            accessEventTarget.dispatchEvent(event);
        });
    };
})(fluid);
