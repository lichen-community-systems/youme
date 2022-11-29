/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");


    /**
     * TODO: Make this grade something that is instantiated once and which can be referred to by any components that
     * need it, such as by using a `fluid.resolveRootSingle` grade:
     *
     * https://docs.fluidproject.org/infusion/development/contexts#global-components-fluidresolveroot-and-fluidresolverootsingle
     *
     * Unfortunately this doesn't work as a named sub-component. We could instantiate an instance globally like the old
     * `flock.enviro`.
     *
     */

    /**
     *
     * Represents the overall Web MIDI system, including references to all the available MIDI ports and the MIDIAccess
     * object.
     *
     */
    fluid.defaults("youme.system", {
        gradeNames: ["fluid.modelComponent", "fluid.resourceLoader"],

        // Since Chrome always prompts regardless, we ask for permission to send sysex by default.
        // https://chromestatus.com/feature/5138066234671104
        sysex: true,
        software: true,

        resources: {
            access: {
                promiseFunc: "{that}.requestAccess"
            }
        },

        model: {
            // Resolves to the MIDIAccess object provided by `navigator.requestMIDIAccess`.
            access: "{that}.resources.access.parsed",
            ports: { inputs: {}, outputs: {} }
        },

        invokers: {
            requestAccess: {
                funcName: "youme.system.requestAccess",
                args: ["{that}", "{that}.options.sysex", "{that}.options.software", "{that}.events.onAccessGranted.fire", "{that}.events.onAccessError.fire", "{that}.refreshPorts"] // sysex, software, onAccessGrantedFn, onAccessErrorFn, refreshPortFn
            },

            refreshPorts: {
                funcName: "youme.system.refreshPorts",
                args: [
                    "{that}.model.access",
                    "{that}.events.onPortsAvailable.fire"
                ]
            }
        },

        events: {
            onAccessGranted: null,
            onAccessError: null,
            onPortsAvailable: null
        },

        listeners: {
            "onAccessError.logError": {
                funcName: "fluid.log",
                args: [fluid.logLevel.WARN, "MIDI Access Error: ", "{arguments}.0"]
            },

            "onPortsAvailable.modelizePorts": {
                funcName: "fluid.replaceModelValue",
                args: ["{that}.applier", "ports", "{arguments}.0"]
            },

            "onDestroy.stopListening": {
                funcName: "youme.system.stopListeningForPortChanges",
                args: ["{that}.model.access"] // accessObject
            }
        }
    });

    // A wrapper for youme.requestAccess that waits to satisfy the promise until additional startup steps are complete.
    youme.system.requestAccess = function (that, sysex, software, onAccessGrantedFn, onAccessErrorFn, refreshPortFn) {
        // We use a wrapped promise to ensure that our followup tasks are completed before any events are fired.
        var wrappedPromise = fluid.promise();

        try {
            var p = youme.requestAccess(sysex, software, onAccessGrantedFn, onAccessErrorFn);

            p.then(function (access) {
                that.applier.change("access", access);
                refreshPortFn();
                access.onstatechange = refreshPortFn;
                wrappedPromise.resolve();
            }, wrappedPromise.reject);
        }
        catch (error) {
            wrappedPromise.reject(error);
        }

        return wrappedPromise;
    };

    youme.system.refreshPorts = function (access, onPortsAvailable) {
        var ports = youme.getPorts(access);
        onPortsAvailable(ports);
    };

    youme.system.stopListeningForPortChanges = function (access) {
        // As only we use this MIDIAccess instance, we can safely unset the state change listener to avoid attempting
        // to respond to state changes while the component is being destroyed.
        if (access) {
            access.onstatechange = null;
        }
    };
})(fluid);
