/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

/*global ArrayBuffer, DataView, CodeMirror*/
(function (fluid) {
    "use strict";

    /**
     * Logs incoming MIDI messages from all <code>youme.connection</code>s, globally.
     */
    fluid.defaults("youme.messageMonitorView", {
        gradeNames: "fluid.codeMirror",

        codeMirrorOptions: {
            lineWrapping: true,
            readOnly: true
        },

        theme: "flockingcm",
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true,

        distributeOptions: {
            // TODO: This is probably, umm, a bit heavy-handed.
            target: "{/ youme.connection}.options",
            record: {
                listeners: {
                    "message.logMIDI": {
                        func: "youme.messageMonitorView.logMIDI",
                        args: [
                            "{midiMessageView}",
                            "{midiMessageView}.options.strings.midiLogMessage",
                            "{arguments}.0",
                            "{arguments}.1"
                        ]
                    }
                }
            }
        },

        strings: {
            midiLogMessage: "%hours:%minutes:%seconds.%millis - %manufacturer %name: %msg"
        }
    });

    youme.messageMonitorView.typedArrayReplacer = function (key, value) {
        if (!ArrayBuffer.isView(value) || value instanceof DataView) {
            return value;
        }

        var arr = new Array(value.length);
        for (var i = 0; i < value.length; i++) {
            arr[i] = value[i];
        }

        return arr;
    };

    /**
     * Pads a number to four digits with zeros.
     *
     * @param {Number} num - the number to pad
     * @return {String} the padded number, as a string
     */
    youme.messageMonitorView.zeroPad = function (num) {
        if (num >= 10000) {
            return num;
        }

        return ("0000" + num).slice(-4);
    };

    youme.messageMonitorView.renderMIDILog = function (msgTemplate, msg, port) {
        var nowDate = new Date();

        return fluid.stringTemplate(msgTemplate, {
            hours: nowDate.getHours(),
            minutes: nowDate.getMinutes(),
            seconds: nowDate.getSeconds(),
            millis: youme.messageMonitorView.zeroPad(nowDate.getMilliseconds()),
            manufacturer: port.manufacturer,
            name: port.name,
            msg: JSON.stringify(msg, youme.messageMonitorView.typedArrayReplacer)
        });
    };

    youme.messageMonitorView.logMIDI = function (that, msgTemplate, msg, rawEvent) {
        var port = rawEvent.target,
            messageText = youme.messageMonitorView.renderMIDILog(msgTemplate, msg, port),
            lastLinePos = CodeMirror.Pos(that.editor.lastLine());

        that.editor.replaceRange(messageText + "\n", lastLinePos);
    };

})(fluid);
