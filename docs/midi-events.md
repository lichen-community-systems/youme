# MIDI Events

This page summarises the MIDI "events" supported by the [core components](core-components.md) provided by this package.
In YouMe, MIDI events typically correspond directly to a MIDI "message", which we represent as a block of JSON. This
page provides a brief summary of each type of event/message. For more details about the meaning of each event, see
[the MIDI specification](https://www.midi.org/specifications-old/item/table-1-summary-of-midi-message).

Please note that most hardware and software solutions only support a subset of the range of possible events. It's a
good idea to consult the manual for your device or software to confirm what it supports.

## Parameter Value Conventions

For each type of event/message, this page provides a sample message in YouMe's JSON format. The `type` parameter in each
example corresponds to the type of message itself, and is the only parameter whose value is a string. All other
parameters are numeric. For all numeric parameters, only whole number (integer) values are supported.

Although many sources such as older MIDI device manuals and online references use hexadecimal values, on this page all
examples, maximum and minimum values use decimal values. You can of course use hexadecimal values in Javascript by
prepending the hex code with zero and an "x", as in `0xFF` or `0xff`.

## Active Sense

A "heartbeat" message which some devices send to let a receiver know that they are still active. In the JSON format used
by YouMe, this message looks something like:

```json5
{
    type: "activeSense"
}
```

There are no additional parameters beyond the required `type` value, which must be set to `activeSense` for this message
type.

## Aftertouch

Sent to indicate that the "pressure" of an existing note should change from the value indicated by the "velocity" of the
original "note on" message (see below). There are two types of aftertouch, "channel", and "polyphonic".

### "Channel" Aftertouch

"Channel" aftertouch messages affect all notes playing on a given channel. In the JSON format used by YouMe, a "channel"
aftertouch message looks something like:

```json5
{
    type: "aftertouch",
    channel: 0,
    pressure: 87
}
```

In addition to the required `type` parameter (which in this case must be set to `aftertouch`), "channel" aftertouch
messages require the following parameters:

| Parameter  | Description                                               | Minimum | Maximum |
|------------|-----------------------------------------------------------|---------|---------|
| `channel`  | The MIDI channel this message should affect.              | 0       | 15      |
| `pressure` | The new "velocity" for all playing notes in this channel. | 0       | 127     |

### "Polyphonic" Aftertouch

A "Polyphonic" aftertouch message affects only a single note playing on a single channel. In the JSON format used by
YouMe, a "polyphonic" aftertouch message looks something like:

```json5
{
    type: "aftertouch",
    channel: 0,
    note: 60,
    pressure: 69
}
```

In addition to the parameters used for a "channel" aftertouch message, polyphonic messages require the following
parameters:

| Parameter  | Description                                  | Minimum | Maximum |
|------------|----------------------------------------------|---------|---------|
| `note`     | The specific playing note to update.         | 0       | 127     |

## Clock

Sent to synchronise performance across devices to the same "clock" (see "Quarter Frame MTC" below for another option).

According to the MIDI specification, 24 clock  messages should be sent per quarter note. Please note that many devices
that can receive clock messages only synchronise with them when configured to, typically using a menu option or button.
In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "clock"
}
```

There are no additional parameters beyond the required `type` value, which must be set to `clock` for this message type.

## Continue

Resume playing the current sequence from the last position at which it was stopped (or the position indicated by
a "song pointer" message, see below). In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "continue"
}
```

There are no additional parameters beyond the required `type` value, which must be set to `continue` for this message
type.

## Control

Indicates a change in the position of a "control" (slider, dial, foot pedal, et cetera). In the JSON format used by
YouMe, this message looks something like:

```json5
{
    type: "control",
    channel: 2,
    number: 74,
    value: 116
}
```

In addition to the required `type` parameter (which in this case must be set to `control`), "control"
messages require the following parameters:

| Parameter | Description                                  | Minimum | Maximum |
|-----------|----------------------------------------------|---------|---------|
| `channel` | The MIDI channel this message should affect. | 0       | 15      |
| `number`  | The control number to update.                | 0       | 127     |
| `value`   | The new "value" for the specified control.   | 0       | 127     |

## Note On

Indicates that a note has been depressed. Conveys the pitch (note) as well as how hard the note was initially pressed
(velocity). In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "noteOn",
    channel: 0,
    note: 60,
    velocity: 69
}
```

In addition to the required `type` parameter (which in this case must be set to `noteOn`), "note on"
messages require the following parameters:

| Parameter  | Description                                     | Minimum | Maximum |
|------------|-------------------------------------------------|---------|---------|
| `channel`  | The MIDI channel this message should affect.    | 0       | 15      |
| `note`     | The note to start playing.                      | 0       | 127     |
| `velocity` | The "velocity" (relative loudness) of the note. | 0       | 127     |

## Note Off

Indicates that a note has been released. In the JSON format used by YouMe, this message looks something like:

```json5
{
    channel: 0,
    note: 60,
    type: "noteOff"
}
```

In addition to the required `type` parameter (which in this case must be set to `noteOff`), "note off"
messages require the following parameters:

| Parameter  | Description                                  | Minimum | Maximum |
|------------|----------------------------------------------|---------|---------|
| `channel`  | The MIDI channel this message should affect. | 0       | 15      |
| `note`     | The note to stop playing.                    | 0       | 127     |

_Note:_ If you are listening for these messages from another MIDI devices or software solution, you should be aware that
some implementations send a "note on" message with a velocity of zero rather than sending "note off" messages.

## Pitchbend

Indicates a "bend" in pitch for all notes playing on the current channel. Although the range supported is constant,
each receiver decides how to apply that range. For example, many keyboards interpret a full downward "bend" of the
pitchbend wheel as a request to shift all playing notes down a full step. Others allow you to configure the meaning
of a full bend, so that the same action might bend all notes down a full octave. In the JSON format used by YouMe, this
message looks something like:

```json5
{
    type: "pitchbend",
    channel: 1,
    value: 5888
}
```

In addition to the required `type` parameter (which in this case must be set to `pitchbend`), "pitch bend"
messages require the following parameters:

| Parameter | Description                                  | Minimum | Maximum |
|-----------|----------------------------------------------|---------|---------|
| `channel` | The MIDI channel this message should affect. | 0       | 15      |
| `value`   | The amount of pitchbend to apply.            | 0       | 16,383  |

Note that the center of the range is 8192. Values lower than 8192 "bend" the pitch lower, and values higher than 8192
"bend" the pitch higher.

## Program Change

Change the program ("patch", "instrument", "preset", et cetera). In the JSON format used by YouMe, this message would
look something like:

```json5
{
    program: 7,
    channel: 2,
    type: "program"
}
```

In addition to the required `type` parameter (which in this case must be set to `program`), "program change"
messages require the following parameters:

| Parameter | Description                                  | Minimum | Maximum |
|-----------|----------------------------------------------|---------|---------|
| `channel` | The MIDI channel this message should affect. | 0       | 15      |
| `program` | The "program" to select.                     | 0       | 127     |

## Quarter Frame MTC

Sent to synchronise performance across devices to the same "clock" (see "Clock" above for another option).  [Quarter
frame MTC messages](https://en.wikipedia.org/wiki/MIDI_timecode) are typically sent four times per frame, and split up
into eight pieces.  The running timestamp is constructed by replacing each piece of the current timestamp as it is
observed.

Each piece has four bits reserved for the type of piece, and four bits of data.  These are often "nibbles" (half of an
eight bit byte), but can also consist of a "sub-nibble" (less than the full four bits in a "nibble").

The following table describes each piece number, and what its bits represent:

| Piece | Description                                                 |
|-------|-------------------------------------------------------------|
| `0`   | Frame, Low "Nibble" (4 bits)                                |
| `1`   | Frame, High "Nibble" (last 1 bit)                           |
| `2`   | Seconds, Low "Nibble" (4 bits)                              |
| `3`   | Seconds, High "Nibble" (last 2 bits)                        |
| `4`   | Minutes, Low "Nibble"  (4 bits)                             |
| `5`   | Minutes, High "Nibble" (last 2 bits)                        |
| `6`   | Hour, Low "Nibble"  (4 bits)                                |
| `7`   | Hour, High "Nibble" (first 1 bit), SMPTE rate (last 3 bits) |

Let's say that the current time corresponds to the following JSON structure:

```json5
{
    rate: 1,
    hour: 0,
    minute: 0,
    second: 0,
    frame: 0
}
```

The `rate` value is a number from `0` to `3` that corresponds to one of the rates in the SMPTE standard:

| Rate | Description                              |
|------|------------------------------------------|
| `0`  | 24 frames/second                         |
| `1`  | 25 frames/second                         |
| `2`  | 29.97 frames/second (SMPTD "drop frame") |
| `3`  | 30 frames/second                         |

For the sake of working in whole millisecond values, let's assume that we are currently at a relative time of 0ms,
and that we are moving at 25 frames per second (or 40ms per frame). At 0ms, we would send the first MTC quarter frame
message:

```json5
{
    type: "quarterFrameMTC",
    piece: 0,
    frame: 0
}
```

At 10ms, we would send the second piece:

```json5
{
    type: "quarterFrameMTC",
    piece: 1,
    frame: 0
}
```

At 20ms, we would send the third piece:

```json5
{
    type: "quarterFrameMTC",
    piece: 2,
    second: 0
}
```

At 30ms, we would send the fourth piece:

```json5
{
    type: "quarterFrameMTC",
    piece: 3,
    second: 0
}
```

At 40ms, we would send the fifth piece:

```json5
{
    type: "quarterFrameMTC",
    piece: 4,
    minute: 0,
}
```

At 50ms, we would send the sixth piece:

```json5
{
    type: "quarterFrameMTC",
    piece: 5,
    minute: 0,
}
```

At 60ms, we would send the seventh piece:

```json5
{
    type: "quarterFrameMTC",
    piece: 6,
    hour: 0,
}
```

At 70ms, we would send the eighth and final piece:

```json5
{
    type: "quarterFrameMTC",
    piece: 7,
    rate: 1,
    hour: 0,
}
```

At 80ms, two full frames have elapsed at our current rate, so we would send piece `0` again with an updated frame value:

```json5
{
    type: "quarterFrameMTC",
    piece: 0,
    frame: 0
}
```

As long as we continue updating the values and sending each piece from `0` to `7` in turn, the "clock" continues to move
forward.  Unlike "Clock" messages, SMPTE also supports the concept of running in reverse, i.e. decrementing the time and
sending the quarter frames in reverse order, from `7` to `0` in turn.

Note that you should be prepared to send quarter frame messages eight times per two frames.  If you update your frame
values more frequently, you might end up sending mismatched "low" and "high" nibbles for frame, which would result in
jitter.

## Reset

Reset a receiver to its "power up" settings. In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "reset"
}
```

There are no additional parameters beyond the required `type` value, which must be set to `reset` for this message type.

## Song Pointer

Sometimes referred to as "song pointer position" or SPP messages. Indicates which "song position" (in "beats) the
device should play a sequence from. In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "songPointer",
    value: 1
}
```

In addition to the required `type` parameter (which in this case must be set to `songPointer`), "song pointer"
messages requires the following parameter:

| Parameter | Description                                                                                                 | Minimum | Maximum |
|-----------|-------------------------------------------------------------------------------------------------------------|---------|---------|
| `value`   | The "song position", i.e. the number of beats (see below) into the sequence the receiver should be playing. | 0       | 16,383  |

A "beat" in MIDI terms is six clock "ticks". Since a quarter note is 24 "ticks", you can think of a "beat" as a
sixteenth note.

## Song Select

In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "songSelect",
    value: 1
}
```

In addition to the required `type` parameter (which in this case must be set to `songSelect`), "song select"
messages require the following parameter:

| Parameter | Description              | Minimum | Maximum |
|-----------|--------------------------|---------|---------|
| `value`   | The song number to play. | 0       | 127     |

## Start

Start the current sequence from the beginning. In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "start"
}
```

There are no additional parameters beyond the required `type` value, which must be set to `start` for this message type.

## Stop

Stop the current sequence. In the JSON format used by YouMe, this message looks something like:

```json5
{
    type: "stop"
}
```

There are no additional parameters beyond the required `type` value, which must be set to `stop` for this message type.

## System Exclusive

System exclusive, or "sysex" messages are a means of transmitting complex information between devices. They are only
meaningful in the context of a specific device, and you should always consult the documentation for your MIDI device
or software solution for help in understand the "sysex" messages it supports.

Sysex messages are typically referenced as an array of bytes, including "framing bytes" common to all messages. YouMe
expects you to omit these opening and closing bytes and transmit only the payload of your message. So, if the manual
for your device suggests that you send `0xF0 0x20 0x08 0x10 07F 0x00 0x01 0xF7` to activate a particular function, you
would omit the leading byte (`0xF0`) and trailing byte (`0xF7`) and your "data" would be as follows:

```json5
{
    type: "sysex",
    data: [0, 32, 8, 16, 127, 0, 1]
}
```

In addition to the required `type` parameter (which in this case must be set to `sysex`), "note on"
messages require the following parameter:

| Parameter | Description                                       |
|-----------|---------------------------------------------------|
| `data`    | An array of bytes representing the sysex payload. |

## Tune Request

A message sent to analog synthesizers requesting that they tune their oscillators. In the JSON format used by YouMe,
this message looks something like:

```json5
{
    type: "tuneRequest"
}
```

There are no additional parameters beyond the required `type` value, which must be set to `tuneRequest` for this message
type.
