# YouMe Documentation

## Core Components

The core components in YouMe can be used to request access to MIDI devices, to interact with ports, and to
connect ports to each other. See [the core component docs](./core-components.md) for more details.

### Standard MIDI Files

YouMe provides functions for reading and writing
["Standard" MIDI files](https://www.midi.org/specifications/file-format-specifications/standard-midi-files). See
the ["Standard" MIDI file docs](./standard-midi-files.md) for more details.

## UI Components

If you would like to display onscreen controls to do things like select your own MIDI port, you can use the grades
provided by YouMe as a starting point. See [the UI component docs](./ui-components.md) for more details.

## Test Components

YouMe provides components and functions designed to help test your work. Chief among them is a test component that is
intended to take the place of the WebMIDI API when running tests, so that you can simulate things like connecting and
disconnecting devices. See [the test helper docs](./test-helpers.md) for more details.
