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

    /**
     *
     * A function to count a component's children matching a grade.
     *
     * @param {Object} parentComponent - The parent component to inspect.
     * @param {String} gradeName - The grade name for the child components we wish to count.
     * @return {Number} - The number of child components with the requested grade name.
     *
     */
    youme.tests.countChildComponents = function (parentComponent, gradeName) {
        var childComponents = 0;

        fluid.visitComponentChildren(parentComponent, function (childComponent) {
            if (fluid.componentHasGrade(childComponent, gradeName)) {
                childComponents++;
            }
        }, {});

        return childComponents;
    };
})(fluid);
