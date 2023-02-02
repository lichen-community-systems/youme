# "Standard" MIDI files

A ["Standard" MIDI file](https://www.midi.org/specifications/file-format-specifications/standard-midi-files) is a way of
representing a series of MIDI events along with information about when they should occur.  YouMe provides support for
reading and writing SMF files.

A Standard MIDI file consists of a single "header" and on or more "tracks".  A "track" is a series of MIDI events
flagged with the relative time at which each event should occur.  In addition to
[the "voice" MIDI events](midi-events.md) supported by this package, "tracks" may include one or more
["meta events"](smf-meta-events.md), such as key or tempo changes.

This package provides functions to translate MIDI files into a JSON representation, and to produce MIDI files from the
same JSON representation.  To use this functionality in your work, you must include the core of YouMe and the file
that enables SMF handling.  See [the demos](../demos/index.html) and [tests](../tests/html/) for examples.

## `youme.smf.parseSMFByteArray(byteArray)`

* `byteArray {Uint8Array}`: An array of unsigned 8-bit integers representing the Standard MIDI file's contents.
* Returns: An object representing the header and all tracks (see below).

This function is designed to parse an array of unsigned 8-bit integers, such as you might obtain by uploading a file or
performing [an XmlHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).

### JSON Format

The following is a representation of a single-track MIDI file that plays a single quarter note.

```json5
{
    errors: [],
    header: {
        format: 0,
        tracks: 1,
        division: {
            type: "ticksPerQuarterNote",
            resolution: 96
        }
    },
    tracks: [{
        errors: [],
        events: [
            {
                timeElapsed: 96,
                messsage: {
                    type: "noteOn",
                    channel: 0,
                    velocity: 127,
                    note: 64
                }
            },
            {
                timeElapsed: 96,
                messsage: {
                    type: "noteOff",
                    channel: 0,
                    velocity: 0,
                    note: 64
                }
            },
            {
                timeElapsed: 0,
                metaEvent: {
                    type: "endOfTrack"
                }
            }
        ]
    }]
}
```

### Individual Events

An individual event consists of a time at which it should occur (see below), and a MIDI message. There are two types of
MIDI messages that can be use in track, "voice" messages and "meta events".

"Voice" messages  are things like "note on", "note off", and "pitch bend" messages, and are described in more detail in
[MIDI Events](midi-events.md).  "Meta events" are unique to SMF files, and are described in
[the SMF meta-event docs](smf-meta-events.md).  "Voice" messages are stored as a `message` element within an event.
SMF "meta" events are stored as a `metaEvent` element within an event object.

#### Measuring Time in MIDI Files

Each MIDI event has two associated time values.  The standard itself stores only a `deltaTime` value.  This "delta time"
represents the time elapsed between the previous event in the track and the current event.

Our JSON structure also stores a `timeElapsed` value, which represents the total time elapsed since the start of the
track.  This information is intended to be helpful when searching and filtering for particular types of events, as you
do not need to track the events you don't care about to calculate when the event should occur.

These times are expressed in the time "division" specified in the header, and modified by various "meta" events,
including "Set Tempo" and "SMPTE Offset" events (see [the SMF meta event docs](smf-meta-events.md)).  You can think of
the process as follows:

1. Read the time signature.
2. Calculate the amount of clock time represented by each unit of "delta" and "elapsed" time.
3. The starting time is now unless there is a "SMPTE Offset" at the start of the track to indicate an initial delay.
4. Move through events, incrementing the number of ticks based on their "delta time".
5. If "Set Tempo" events are encountered, adjust the amount of clock time to allocate for each unit of "delta" and
   "elapsed" time.

The initial "time per tick" as found in the header can either be expressed in terms of ticks per quarter note, or
frames per second (SMPTE).  Here is an example time signature that uses ticks per quarter note:

```json5
{
   header: {
      division: {
         type: "ticksPerQuarterNote",
         resolution: 96
      }
      // Remaining header material
   }
   // Track information
}
```

The time per tick is determined by a "Set Tempo" meta event (see [the SMF meta event docs](smf-meta-events.md)).  If no
"Set Tempo" message is found, the default time per tick is 500,000 microseconds (120 BPM). In the above example, the
`resolution` is 96, so there should be 5,208 microseconds (or 5.208 milliseconds) per tick.

See [this page](https://www.recordingblogs.com/wiki/time-division-of-a-midi-file) for more examples, including more
detail about SMPTE timing.

### Error Handling

Wherever possible, this function will attempt to parse as much data as possible.  If errors occur, they are flagged in
place, and also added to the next enclosing layer of the object, as follows:

1. If there is an overall error processing the file that prevents reading track or header data, it will be recorded in
   the top-level `errors` array.
2. If there is an error processing a track that is not associated with a particular event, the error will be recorded in
   the `errors` array for the track, and also included in the top-level `errors` array.
3. If there is an error processing an event, it will be recorded in the event itself, in the `errors` array for the
   track, and in the top-level `errors` array.
