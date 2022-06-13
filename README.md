# fluid-midi

This package models the [WebMIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) as a series of
[Fluid components](https://fluidproject.org/infusion.html).

## Requirements

The components in this package require:

1. The dependencies of this package, which you can install using a command like `npm install`.
2. A compatible browser (at time of writing, only Chromium and derivatives like Chrome, Edge, and Opera).

## Try It!

This package provides a few demonstrations that you can try out in your browser. Once you have installed all
dependencies (see above), open [the demonstration page](demos/index.html) in a compatible browser.

## Tests

This package includes a test suite.  Once you have installed dependencies, you can run the tests using the command
`npm test`.  You must have a compatible browser (see above) to run the tests.  By default, the tests run against
instrumented code in order to verify test code coverage.  They also run in continuous integration mode, launching all
supported browsers in turn and exiting when the tests have finished running.

If you want to debug tests in your browser, you can launch Testem without instrumentation and in "development mode" using
a command like:

`DISABLE_INSTRUMENTATION=true node node_modules/.bin/testem --file tests/testem.js`

Follow the onscreen instructions and connect your browser to the URL provided by Testem.

If you want to run the tests without Testem, you will need to host the code in a test server to avoid browser
sandbox issues.  As an example, if you have `python3` installed, you can:

- Host the content by running a command like `python3 http.server` from the root of the repository
- Open [`tests/all-tests.html`](http://localhost:8000/tests/all-tests.html) in a compatible browser.

## Learn More

To learn more about using this package in your own code, check out [the documentation](docs/index.md), which includes
API documentation and usage examples.

## Contributing Your Own Changes

This package is an open source project that welcomes contributions.  To find out more, read
[our contribution guidelines](CONTRIBUTING.md).

## Migrating from `flocking-midi` (and earlier versions of Flocking )

This package based on and extends the original [flocking-midi](https://github.com/continuing-creativity/flocking-midi)
project, and was written in conversation with that package's author.  `flocking-midi` was itself originally part of
[Flocking](https://github.com/continuing-creativity/flocking). Users coming from either of those environments will see
some familiar grades, but there are a few key differences in this package that are worth noting.

First, this package no longer depends on `Flocking` for its UI components. The new [`portConnector`](docs/port-connector.md)
provides a UI-agnostic means of connecting to a selected MIDI port.  If you are using something other than Infusion to
build your front-end interface, you should build your work on top of this grade.

If you are building your front end using Infusion, this package provides sample UI components that require infusion
4.0.0 or higher.  See [the UI component documentation](docs/ui-components.md) for more information.
