# MIDI Events

This page summarises the MIDI "events" supported by the [core components](core-components.md) provided by this package.
In YouMe, MIDI events typically correspond directly to a MIDI "message", which we represent as a block of JSON. This
page provides a brief summary of each type of event/message. For more details about the meaning of each event, see
[the MIDI specification](https://www.midi.org/specifications-old/item/table-1-summary-of-midi-message).

Please note that most hardware and software solutions only support a subset of the range of possible events. It's a
good idea to consult the manual for your device or software to confirm what it supports.

## Conventions Used in this page.

Each message type is describe, and an example of the message in YouMe's JSON format is provided.  The `type` parameter
in each example corresponds to the type of message itself, any other parameters are described including maximum and
minimum values where possible.  Although many sources such as older MIDI device manuals and online references use
hexadecimal values, all examples, maximum and minimum values in this page are expressed as decimal values.  In all
cases, only integer values are supported.

## Active Sense

A "heartbeat" message sent by some devices to let a receiver know that they are still active. In the JSON format used
by YouMe, this message would look something like:

```json5
{
    type: "activeSense"
}
```

There are no additional parameters beyond the required `type` value.

## Aftertouch

Sent to indicate that the "pressure" of an existing note should change from the value indicated by the original
"note on" message (see below). There are two types of aftertouch, "channel", which affects all notes playing on a given
channel, and "polyphonic", which affects only a single note playing on a single channel.

### "Channel" Aftertouch

In the JSON format used by YouMe, a "channel" aftertouch message would look something like:

```json5
{
    type: "aftertouch",
    channel: 0,
    pressure: 87
}
```

| Parameter  | Description                                               | Minimum | Maximum |
|------------|-----------------------------------------------------------|---------|---------|
| `channel`  | The MIDI channel this message should affect.              | 0       | 15      |
| `pressure` | The new "velocity" for all playing notes in this channel. | 0       | 127     |

### "Polyphonic" Aftertouch

In the JSON format used by YouMe, a "polyphonic" aftertouch message would look something like:

```json5
{
    type: "aftertouch",
    channel: 0,
    note: 60,
    pressure: 69
}
```

| Parameter  | Description                                  | Minimum | Maximum |
|------------|----------------------------------------------|---------|---------|
| `channel`  | The MIDI channel this message should affect. | 0       | 15      |
| `note`     | The specific playing note to update.         | 0       | 127     |
| `pressure` | The new "velocity" for the specified note.   | 0       | 127     |

## Clock

Used to synchronise performance across devices to the same "clock". Typically, 24 clock messages are sent per quarter
note. Please note that many devices that can receive control messages only synchronise with them when configured to,
typically by a menu option or button. In the JSON format used by YouMe, this message would look something like:

```json5
{
    type: "clock"
}
```

There are no additional parameters beyond the required `type` value.

## Continue

Resume playing the current sequence from the last position at which it was stopped. In the JSON format used by YouMe,
this message would look something like:

```json5
{
    type: "continue"
}
```

There are no additional parameters beyond the required `type` value.

## Control

Indicates a change in the position of a "control" (slider, dial, foot pedal, et cetera). In the JSON format used by
YouMe, this message would look something like:

```json5
{
    type: "control",
    channel: 2,
    number: 74,
    value: 116
}
```

| Parameter | Description                                  | Minimum | Maximum |
|-----------|----------------------------------------------|---------|---------|
| `channel` | The MIDI channel this message should affect. | 0       | 15      |
| `number`  | The control number to update.                | 0       | 127     |
| `value`   | The new "value" for the specified control.   | 0       | 127     |

## Note On

Indicates that a note has been depressed. Conveys the pitch (note) as well as how hard the note was initially pressed
(velocity). In the JSON format used by YouMe, this message would look something like:

```json5
{
    type: "noteOn",
    channel: 0,
    note: 60,
    velocity: 69
}
```

| Parameter  | Description                                     | Minimum | Maximum |
|------------|-------------------------------------------------|---------|---------|
| `channel`  | The MIDI channel this message should affect.    | 0       | 15      |
| `note`     | The note to start playing.                      | 0       | 127     |
| `velocity` | The "velocity" (relative loudness) of the note. | 0       | 127     |

## Note Off

Indicates that a note has been released. Note that some devices send a "note on" message with a velocity of zero instead
of sending "note off" messages. In the JSON format used by YouMe, this message would look something like:

```json5
{
    channel: 0,
    note: 60,
    type: "noteOff"
}
```

| Parameter  | Description                                  | Minimum | Maximum |
|------------|----------------------------------------------|---------|---------|
| `channel`  | The MIDI channel this message should affect. | 0       | 15      |
| `note`     | The note to stop playing.                    | 0       | 127     |

## Pitchbend

Indicates a "bend" in pitch for all notes playing on the current channel.  Although the range supported is constant,
each receiver decides how to apply that range.  For example, many keyboards interpret a full downward "bend" of the
pitchbend wheel as a request to shift all playing notes down a full step.  Others allow you to configure the meaning
of a full bend, so that the same action might bend all notes down a full octave.  In the JSON format used by YouMe, this
message would look something like:

```json5
{
    type: "pitchbend",
    channel: 1,
    value: 5888
}
```

| Parameter | Description                                  | Minimum | Maximum |
|-----------|----------------------------------------------|---------|---------|
| `channel` | The MIDI channel this message should affect. | 0       | 15      |
| `value`   | The amount of pitchbend to apply.            | 0       | 16,383  |

Note that the center of the range is 8192>  Values lower than 8192 "bend" the pitch lower, and values higher than 8192
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

| Parameter | Description                                  | Minimum | Maximum |
|-----------|----------------------------------------------|---------|---------|
| `channel` | The MIDI channel this message should affect. | 0       | 15      |
| `program` | The "program" to select.                     | 0       | 127     |

## Reset

Reset a receiver to its "power up" settings.  In the JSON format used by YouMe, this message would look something like:

```json5
{
    type: "reset"
}
```

There are no additional parameters beyond the required `type` value.

## Song Pointer

A message indicating which "song position" (in "beats) the device should play at.
In the JSON format used by YouMe, this message would look something like:

```json5
{
    type: "songPointer",
    value: 1
}
```

| Parameter | Description                                                                                                 | Minimum | Maximum |
|-----------|-------------------------------------------------------------------------------------------------------------|---------|---------|
| `value`   | The "song position", i.e. the number of beats (see below) into the sequence the receiver should be playing. | 0       | 16,383  |

A "beat" in MIDI terms is six clock "ticks".  Since a quarter note is 24 "ticks", you can think of a "beat" as a
sixteenth note.

## Song Select

In the JSON format used by YouMe, this message would look something like:

```json5
{
    type: "songSelect",
    value: 1
}
```

| Parameter | Description              | Minimum | Maximum |
|-----------|--------------------------|---------|---------|
| `value`   | The song number to play. | 0       | 127     |

## Start

Start the current sequence from the beginning. In the JSON format used by YouMe, this message would look something like:

```json5
{
    type: "start"
}
```

There are no additional parameters beyond the required `type` value.

## Stop

Stop the current sequence. In the JSON format used by YouMe, this message would look something like:

```json5
{
    type: "stop"
}
```

There are no additional parameters beyond the required `type` value.

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

| Parameter | Description                                       |
|-----------|---------------------------------------------------|
| `data`    | An array of bytes representing the sysex payload. |

## Tune Request

A message sent to analog synthesizers requesting that they tune their oscillators. In the JSON format used by YouMe,
this message would look something like:

```json5
{
    type: "tuneRequest"
}
```

There are no additional parameters beyond the required `type` value.
