/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");
    fluid.registerNamespace("youme.tests");

    /**
     *
     * Create a WebMIDI mock instance and wire it up in place of `navigator.requestMIDIAccess`.
     *
     * @param {Options} midiMockOptions - The options to use when creating the mock.
     * @return {Object} - An instance of `youme.tests.webMidiMock`.
     *
     */
    youme.tests.createWebMidiMock = function (midiMockOptions) {
        var webMidiMock = youme.tests.webMidiMock(midiMockOptions);
        navigator.requestMIDIAccess = webMidiMock.requestMIDIAccess;
        return webMidiMock;
    };
})(fluid);
