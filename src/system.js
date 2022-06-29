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
    // TODO: Try 4.1.0-dev.20220506T100231Z.d681cae69.FLUID-6728

    /**
     *
     * Represents the overall Web MIDI system, including references to all the available MIDI ports and the MIDIAccess
     * object.
     *
     */
    fluid.defaults("youme.system", {
        gradeNames: ["fluid.modelComponent"],

        // Since Chrome always prompts regardless, we ask for permission to send sysex by default.
        // https://chromestatus.com/feature/5138066234671104
        sysex: true,
        software: true,

        members: {
            access: undefined
        },

        model: {
            ports: { inputs: {}, outputs: {} }
        },

        invokers: {
            requestAccess: {
                funcName: "youme.requestAccess",
                args: [
                    "{that}.options.sysex",
                    "{that}.options.software",
                    "{that}.events.onAccessGranted.fire",
                    "{that}.events.onAccessError.fire"
                ]
            },

            refreshPorts: {
                funcName: "youme.system.refreshPorts",
                args: [
                    "{that}.access",
                    "{that}.events.onPortsAvailable.fire"
                ]
            }
        },

        events: {
            onAccessGranted: null,
            onAccessError: null,
            onReady: null,
            onPortsAvailable: null
        },

        listeners: {
            "onCreate.requestAccess": {
                func: "{that}.requestAccess"
            },

            "onAccessGranted.setAccess": {
                func: "youme.system.setAccess",
                args: ["{that}", "{arguments}.0"]
            },

            "onAccessGranted.refreshPorts": {
                priority: "after:setAccess",
                func: "{that}.refreshPorts"
            },

            "onAccessGranted.bindAutoRefresh": {
                priority: "after:refreshPorts",
                funcName: "youme.system.listenForPortChanges",
                args: ["{that}", "{arguments}.0"] // accessObject
            },

            "onAccessGranted.fireOnReady": {
                priority: "after:bindAutoRefresh",
                func: "{that}.events.onReady.fire",
                args: ["{that}.ports)"]
            },

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
                args: ["{that}.access"] // accessObject
            }
        }
    });

    youme.system.setAccess = function (that, access) {
        that.access = access;
    };

    youme.system.refreshPorts = function (access, onPortsAvailable) {
        var ports = youme.getPorts(access);
        onPortsAvailable(ports);
    };

    youme.system.listenForPortChanges = function (that, access) {
        access.onstatechange = that.refreshPorts;
    };

    youme.system.stopListeningForPortChanges = function (access) {
        // As only we use this MIDIAccess instance, we can safely unset the state change listener to avoid attempting
        // to respond to state changes while the component is being destroyed.
        if (access) {
            access.onstatechange = null;
        }
    };
})(fluid);
