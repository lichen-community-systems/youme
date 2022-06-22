<!--
   Copyright 2022, Tony Atkins
   Copyright 2011-2020, Colin Clark

   Licensed under the MIT license, see LICENSE for details.
-->
# `youme.tests.webMidiMock`

This package emulates the core behaviour of the WebMIDI API, and provides mocks of the objects the WebMIDI API would
provide if used in the same way.  You can use this to test things like:

1. How your code responds as ports connect and disconnect.
2. How your code responds to (simulated) incoming messages on a port.
3. Whether outgoing messages are sent as expected.

When instantiated, this component replaces `navigator.requestMIDIAccess` with one of its invokers.  As such, you cannot
instantiate this component and expect to interact with the WebMIDI API at the same time.  If you are running multiple
tests, only the most recent instance of the grade will intercept calls to `navigator.requestMIDIAccess`.

## Component Options

| Name           | Type      | Description                                                                              | Default                                           |
|----------------|-----------|------------------------------------------------------------------------------------------|---------------------------------------------------|
| `rejectAccess` | `Boolean` | If set to `true`, reject access when it is requested.                                    | `false`                                           |
| `inputSpecs`   | `Object`  | An object whose members are "port specs" describing the inputs to simulate (see below).  | An empty object.                                  |
| `outputSpecs`  | `Object`  | An object whose members are "port specs" describing the outputs to simulate (see below). | An empty object.                                  |
| `portDefaults` | `Object`  | A "port spec" that describes the defaults for all ports.                                 | All ports are closed and disconnected by default. |

### Port Specs

Both `inputSpecs` and `outputSpecs` are objects whose members are individual "port specs", i.e. objects that describe
a single port.  These are combined with `portDefaults`, which is also a partial "port spec" that describes the defaults
for all available ports.

| Name           | Description                                                     |
|----------------|-----------------------------------------------------------------|
| `id`           | The unique ID of the device associated with the port.           |
| `name`         | The name of the device associated with the port.                |
| `manufacturer` | The manufacturer of the device associated with the port.        |
| `type`         | The type of port, either "input", or "output".                  |
| `state`        | The state of the port, either "open", "pending", or "closed".   |
| `connected`    | "connected" if the port is connected, "disconnected" otherwise. |

All properties should be strings.  Although pattern matching is supported for other usages of "port specs", you should
specify full and literal strings for each property used in the above component options.

## Member Variables

| Name                      | Description                                                                                   |
|---------------------------|-----------------------------------------------------------------------------------------------|
| `calls.requestMIDIAccess` | An array recording the full arguments passed in each call to `requestMIDIAccess` (see below). |
| `accessEventTargets`      | An array containing the "event targets" (see below) for each access object.                   |
| `inputs`                  | An object whose members are mocked MIDI input ports (see below).                              |
| `outputs`                 | An object whose members are mocked MIDI output ports (see below).                             |

### Function Call Registries

Each mock instance includes a register of calls made to methods in its API. For example, from the
perspective of an output port mock, `{port}.calls.sent.length` represents the number of times the `sent` method
was called, and `{port}.calls.sent[0]` represents the arguments passed for the first call to the `sent` method.

From the perspective of the enclosing `youme.tests.webMidiMock` component, the same information would be found at
`{that}.outputs.get({id}).calls.sent.length` and `{that}.outputs.get({id}).calls.sent[0]`.

### Event Targets

In order to behave as the WebMIDI API does, we need to be able to trigger and respond to various events.  We use "event
targets" to mock this behaviour, and these are exposed as member variables so that you can listen for or trigger events
as part of your tests.

### Mocks

#### `MIDIAccess` Mock

| Name               | Type                     | Description                                                                              |
|--------------------|--------------------------|------------------------------------------------------------------------------------------|
| `sysexEnabled`     | `Boolean`                | Whether we can send/receive sysex messages using this access object.                     |
| `inputs`           | `Map<String,MIDIInput>`  | A map of input mocks (see below).                                                        |
| `outputs`          | `Map<String,MIDIOutput>` | A map of output mocks (see below).                                                       |
| `calls`            | `Object`                 | A register of calls made to each function, including the arguments supplied (see above). |
| `onstatechange`    | `Function`               | A function to call when ports change (connect, disconnect, etc.).                        |
| `addEventListener` | `Function`               | Add a listener for events the access object receives.                                    |
| `dispatchEvent`    | `Function`               | Dispatch an event to the access object.                                                  |

#### `MIDIPort` Mock

##### Properties

| Name           | Type       | Description                                                                              |
|----------------|------------|------------------------------------------------------------------------------------------|
| `id`           | `String`   | The unique ID of the device associated with the port.                                    |
| `name`         | `String`   | The name of the device associated with the port.                                         |
| `manufacturer` | `String`   | The manufacturer of the device associated with the port.                                 |
| `type`         | `String`   | The type of port, either "input", or "output".                                           |
| `state`        | `String`   | The state of the port, either "open", "pending", or "closed".                            |
| `connected`    | `String`   | "connected" if the port is connected, "disconnected" otherwise.                          |
| `calls`        | `Object`   | A register of calls made to each function, including the arguments supplied (see above). |

##### Methods

###### `{MIDIPort}.open()`

* Returns: A `Promise` that is already resolved.

A function that will handle requests to open a connection to this port.

###### `{MIDIPort}.close()`

* Returns: A `Promise` that is already resolved.

A function that will handle requests to close the connection to this port.

#### `MIDIInput` Mock

In addition to the properties and functions supported by a `MIDIPort` (see above), a MIDI input has two additional
methods:

##### `{MIDIInput}.addEventListener(messageType, listener)`

* `messageType {String}` - The type of message (typically `"midimessage"`).
* `listener {Function}` - A function to call when an `Event` of `messageType` is dispatched to the `MIDIInput`.  The
  function should accept one argument, namely the `Event`.

##### `{MIDIInput}.dispatchEvent(event)`

* `event {Event}` - The event to dispatch (should be a [MIDIMessageEvent](https://developer.mozilla.org/en-US/docs/Web/API/MIDIMessageEvent)).
* Returns: Nothing.

Dispatch an event to the input.

#### `MIDIOutput` Mock

In addition to the properties and functions supported by a `MIDIPort` (see above), a MIDI output has two additional
methods:

##### `{MIDIOutput}.send(midiMessage)`

* `midiMessage {Uint8Array}` - An Uint8Array representing the MIDI message to be sent, see [`MIDIMessageEvent.data`](https://developer.mozilla.org/en-US/docs/Web/API/MIDIMessageEvent/data) for more details.
* Returns: Nothing.

A function that handles requests to send messages to this port.

##### `{MIDIOutput}.clear()`

* Returns: Nothing.

A function that handles requests to clear messages in progress being sent by this port.

## Invokers

### `{youme.tests.webMidiMock}.addPort(portSpec)`

* `portSpec` - The port specification (see above).
* Returns: Nothing.

If you need to test how your component handles new ports (or ports that have been disconnected and reconnected), you
can use this invoker to simulate a new port appearing.

### `{youme.tests.webMidiMock}.closePort(portSpec)`

* `portSpec` - The port specification (see above).
* Returns: Nothing.

Flag a given port as "closed".

### `{youme.tests.webMidiMock}.connectPort(portSpec)`

* `portSpec` - The port specification (see above).
* Returns: Nothing.

Flag a given port as "connected".

### `{youme.tests.webMidiMock}.disconnectPort(portSpec)`

* `portSpec` - The port specification (see above).
* Returns: Nothing.

Flag a given port as "disconnected".

### `{youme.tests.webMidiMock}.findPorts(portSpec)`

Search both inputs and outputs for anything matching `portSpec` and return an array of matches.

### `{youme.tests.webMidiMock}.openPort(portSpec)`

* `portSpec` - The port specification (see above).
* Returns: Nothing.

Flag a given port as "open".

### `{youme.tests.webMidiMock}.requestMIDIAccess(midiAccessOptions)`

* `midiAccessOptions.software` - Whether to request the ability to send / receive from "software" instruments.
* `midiAccessOptions.sysex` - Whether to request the ability to send / receive sysex messages.
* Returns: A `Promise` that resolves with a MIDIAccess mock (see above).

Handle a request for MIDI access by either resolving with a MIDIAccess mock (see above), or rejecting with an error.

## `youme.tests.webMidiMock.generateMockPort(portDefaults, portSpec, [shouldReject])`

* `portDefaults` - The defaults for the new port mock (see above).
* `portSpec` - The port specification (see above).
* `shouldReject` - If `true`, `open` and `close` return a rejected promise instead of a resolved one.
* Returns: A port mock.

If you are writing lower level code to work with a port directly, you can generate a MIDI port mock without
instantiating a full `youme.tests.webMidiMock` component by directly accessing this function.
