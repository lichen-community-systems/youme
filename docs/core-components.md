<!--
   Copyright 2022, Tony Atkins
   Copyright 2011-2020, Colin Clark

   Licensed under the MIT license, see LICENSE for details.
-->
# Core Components

This page describes the "core" components of YouMe, i.e. those which do not need to be associated with markup on a
page in order to operate. If you are more interested in "view" components that provide onscreen controls, check out
[the UI component docs](./ui-components.md).

## `youme.system`

This component interfaces with the WebMIDI API, keeping track of ports, and opening and closing connections. It is
used by nearly every other grade in this package.

### Component Options

| Name       | Type        | Description                                                             | Default |
|------------|-------------|-------------------------------------------------------------------------|---------|
| `sysex`    | `{Boolean}` | Whether to request permission to send/receive sysex messages.           | `true`  |
| `software` | `{Boolean}` | Whether to request permission to interact with "software" synthesizers. | `true`  |

See [the WebMIDI API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#parameters)
for more details.

### Invokers

#### `{youme.system}.requestAccess()`

* Returns: A `Promise` that will resolve with [a MIDIAccess object](https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess)
  or reject with an error.

Request access to MIDI inputs and outputs. This invoker is called on startup by `youme.system`, you should not need to
call this directly.

#### `{youme.system}.refreshPorts()`

* Returns: Nothing.

Refresh the list of ports. You should not need to call this directly.

## `youme.connection`

The base grade for all input and output connections. It is designed to manage communications with a single
[MIDIPort](https://developer.mozilla.org/en-US/docs/Web/API/MIDIPort). You should not use this grade directly. Instead,
you should use either `youme.connection.input` or `youme.connection.output` (see below).

### Component Options

| Name         | Type        | Description                                                                                                            | Default |
|--------------|-------------|------------------------------------------------------------------------------------------------------------------------|---------|
| `model.open` | `{Boolean}` | Whether our associated [MIDIPort](https://developer.mozilla.org/en-US/docs/Web/API/MIDIPort) should be open or closed. | `false` |

### Events

| Event         | Description                                               |
|---------------|-----------------------------------------------------------|
| `onPortOpen`  | Fired when our port is opened successfully.               |
| `onPortClose` | Fired when our port is closed successfully.               |
| `onError`     | Fired when there is an error opening or closing our port. |

## `youme.connection.input`

A connection to a [MIDIInput](https://developer.mozilla.org/en-US/docs/Web/API/MIDIInput).

### Events

In addition to the events for the base `youme.connection` grade, this grade has the following events.

| Event           | Description                                                         |
|-----------------|---------------------------------------------------------------------|
| `onActiveSense` | An event that is fired when an "active sense" message is received.  |
| `onAftertouch`  | An event that is fired when an "after touch" message is received.   |
| `onClock`       | An event that is fired when a "clock" message is received.          |
| `onContinue`    | An event that is fired when a "clock continue" message is received. |
| `onControl`     | An event that is fired when an "control" message is received.       |
| `onMessage`     | An event that is fired when any message is received.                |
| `onNoteOn`      | An event that is fired when a "note on" message is received.        |
| `onNoteOff`     | An event that is fired when a "note off" message is received.       |
| `onPitchbend`   | An event that is fired when a "pitch bend" message is received.     |
| `onProgram`     | An event that is fired when a "program change" message is received. |
| `onReset`       | An event that is fired when a "reset" message is received.          |
| `onSongPointer` | An event that is fired when a "song pointer" message is received.   |
| `onSongSelect`  | An event that is fired when a "song select" message is received.    |
| `onStart`       | An event that is fired when a "clock start" message is received.    |
| `onStop`        | An event that is fired when a "clock stop" message is received.     |
| `onSysex`       | An event that is fired when a "sysex" message is received.          |
| `onTuneRequest` | An event that is fired when a "tune request" message is received.   |

See [the MIDI events documentation](midi-events.md) for details on each event type, including example messages.

## `youme.connection.output`

### Events

In addition to the events for the base `youme.connection` grade, this grade has the following events.

| Event             | Description                                                |
|-------------------|------------------------------------------------------------|
| `sendActiveSense` | An event that is fired to send an "active sense" message.  |
| `sendAftertouch`  | An event that is fired to send an "after touch" message.   |
| `sendClock`       | An event that is fired to send a "clock" message.          |
| `sendContinue`    | An event that is fired to send a "clock continue" message. |
| `sendControl`     | An event that is fired to send an "control" message.       |
| `sendMessage`     | An event that is fired to send any message.                |
| `sendNoteOn`      | An event that is fired to send a "note on" message.        |
| `sendNoteOff`     | An event that is fired to send a "note off" message.       |
| `sendPitchbend`   | An event that is fired to send a "pitch bend" message.     |
| `sendProgram`     | An event that is fired to send a "program change" message. |
| `sendReset`       | An event that is fired to send a "reset" message.          |
| `sendSongPointer` | An event that is fired to send a "song pointer" message.   |
| `sendSongSelect`  | An event that is fired to send a "song select" message.    |
| `sendStart`       | An event that is fired to send a "clock start" message.    |
| `sendStop`        | An event that is fired to send a "clock stop" message.     |
| `sendSysex`       | An event that is fired to send a "sysex" message.          |
| `sendTuneRequest` | An event that is fired to send a "tune request" message.   |

See [the MIDI events documentation](midi-events.md) for details on each event type, including example messages.

## `youme.portConnector`

Handle creating a connection (see above) based on a port specification and the list of ports provided by its instance
of `youme.system` (see above). The base grade should not be used directly, you should use either
`youme.portConnector.input` or `youme.portConnector.output` (see below).

### Component Options

| Name             | Type         | Description                                                                                                 | Default |
|------------------|--------------|-------------------------------------------------------------------------------------------------------------|---------|
| `model.open`     | `{Boolean}`  | Whether our [MIDIPort](https://developer.mozilla.org/en-US/docs/Web/API/MIDIPort) should be open or closed. | `false` |
| `model.portSpec` | `{PortSpec}` | The port specification (see below) for the port we wish to connect to.                                      | `null`  |

### Port Specifications

A port specification is an object that describes the port to which we wish to connect. Consists of one or more of the
following fields:

| Name           | Type       | Description                                                                 |
|----------------|------------|-----------------------------------------------------------------------------|
| `id`           | `{String}` | The unique ID of the device associated with the port.                       |
| `name`         | `{String}` | The name of the device associated with the port. Support patterns.          |
| `manufacturer` | `{String}` | The manufacturer of the device associated with the port. Supports patterns. |
| `type`         | `{String}` | The type of port, either "input", or "output".                              |
| `state`        | `{String}` | The state of the port, either "open", "pending", or "closed".               |
| `connected`    | `{String}` | "connected" if the port is connected, "disconnected" otherwise.             |

The `name` and `manufacturer` fields support [regular expression pattern matching](https://www.w3schools.com/jsref/jsref_obj_regexp.asp).

### Events

| Event         | Description                                                            |
|---------------|------------------------------------------------------------------------|
| `onPortOpen`  | Fired when our connection's port is opened successfully.               |

## `youme.portConnector.input`

A port connector intended to work with inputs.

### Events

This component relays events from its associated `youme.connection.input` grade (see above).

## `youme.portConnector.output`

A port connector intended to work with outputs.

### Events

This component relays events to its associated `youme.connection.output` grade (see above).

## `youme.multiPortConnector`

The base grade for all "multi port" connectors, which connect to one or more ports of the same type (input or output).
You should not use this directly, you should use `youme.multiportConnector.inputs` or `youme.multiPortConnector.outputs`
instead.

### Component Options

| Name              | Type                | Description                                                                      | Default |
|-------------------|---------------------|----------------------------------------------------------------------------------|---------|
| `model.portSpecs` | `{Array<PortSpec>}` | An array of port specifications (see above) for the ports we wish to connect to. | `[]`    |

## `youme.multiportConnector.inputs`

A "multi port" connector designed to relay events from one or more inputs.

### Events

This component relays events from its associated `youme.connection.input` grades (see above).

## `youme.multiPortConnector.outputs`

A "multi port" connector designed to relay events to one or more outputs.

### Events

This component relays events to its associated `youme.connection.output` grades (see above).
