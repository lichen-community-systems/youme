/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
(function (fluid) {
    "use strict";

    /**
     * An abstract grade that the defines the event names for receiving MIDI messages
     */
    fluid.defaults("youme.messageReceiver", {
        gradeNames: ["fluid.component"],

        events: {
            onActiveSense: null,
            onAftertouch: null,
            onClock: null,
            onContinue: null,
            onControl: null,
            onMessage: null,
            onNoteOn: null,
            onNoteOff: null,
            onPitchbend: null,
            onProgram: null,
            onRaw: null,
            onReset: null,
            onSongPointer: null,
            onSongSelect: null,
            onStart: null,
            onStop: null,
            onSysex: null,
            onTuneRequest: null
        }
    });

    fluid.defaults("youme.messageSender", {
        gradeNames: ["fluid.component"],

        events: {
            sendActiveSense: null,
            sendAftertouch: null,
            sendClock: null,
            sendContinue: null,
            sendControl: null,
            sendMessage: null,
            sendNoteOn: null,
            sendNoteOff: null,
            sendPitchbend: null,
            sendProgram: null,
            sendRaw: null,
            sendReset: null,
            sendSongPointer: null,
            sendSongSelect: null,
            sendStart: null,
            sendStop: null,
            sendSysex: null,
            sendTuneRequest: null
        }
    });
})(fluid);
