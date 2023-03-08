/*
 * Copyright 2023, Tony Atkins
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */
/*

    A script to wrap MIDI files as namespaced javascript variables.  This allows us to avoid sandboxing issues in
    retrieving MIDI file data, and also allows us to avoid the complexity of making an asynchronous XHR call.

    Should be run as part of the `pretest` npm script before the tests are run.  The output should be checked in.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");

var youme = fluid.registerNamespace("youme");

// Needed to be able to use package-relative paths.
fluid.require("%youme");

fluid.defaults("youme.tests.midiWrapper", {
    gradeNames: ["fluid.component"],
    inputDir: "%youme/tests/midi",
    outputDir: "%youme/tests/wrapped-midi",

    // This is only expressed as a template literal to allow it to wrap over multiple lines.
    wrapperTemplate: `/* Auto-generated wrapped MIDI file, do not edit manually */
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");
    fluid.registerNamespace("youme.tests.midi");
    fluid.set(youme.tests.midi, %keys, %content);
})(fluid);
`,
    listeners: {
        "onCreate.scanMidiFiles": {
            funcName: "youme.tests.midiWrapper.scanMidiFiles",
            args: ["{that}"]
        }
    }
});

youme.tests.midiWrapper.scanMidiFiles = function (that) {
    var resolvedInputDirectory = fluid.module.resolvePath(that.options.inputDir);
    var filesToScan = youme.tests.midiWrapper.scanSingleDirectory(that, resolvedInputDirectory);

    fluid.each(filesToScan, function (fullInputPath) {
        youme.tests.midiWrapper.wrapSingleFile(that, fullInputPath);
    });

    fluid.log(fluid.logLevel.WARN, "Wrapped " + filesToScan.length + " MIDI Files as namespaced javascript.");
};

youme.tests.midiWrapper.scanSingleDirectory = function (that, pathToRead) {
    var filesFound = [];
    var directoryEntries = fs.readdirSync(pathToRead, { encoding: "utf-8", withFileTypes: true});
    fluid.each(directoryEntries, function (directoryEntry) {
        if (directoryEntry.isDirectory()) {
            var subDirPath = path.resolve(pathToRead, directoryEntry.name);
            var subDirectoryEntries = youme.tests.midiWrapper.scanSingleDirectory(that, subDirPath);
            if (subDirectoryEntries.length) {
                filesFound.push(...subDirectoryEntries);
            }
        }
        else if (directoryEntry.isFile() && directoryEntry.name.endsWith(".mid")) {
            var fullInputPath = path.resolve(pathToRead, directoryEntry.name);
            filesFound.push(fullInputPath);
        }
    });
    return filesFound;
};

youme.tests.midiWrapper.wrapSingleFile = function (that, fullInputFilePath) {
    var resolvedRootInputPath = fluid.module.resolvePath(that.options.inputDir);
    var resolvedRootOutputPath = fluid.module.resolvePath(that.options.outputDir);

    var relativePath = path.relative(resolvedRootInputPath, fullInputFilePath);
    var keys = relativePath.split(path.sep);

    var outputDirRelativePath = keys.slice(0, -1).join(path.sep);
    var fullOutputDirPath = path.resolve(resolvedRootOutputPath, outputDirRelativePath);
    var jsFileName = (keys[keys.length - 1]).replace(/.mid$/, ".js");
    var fullOutputFilePath = path.resolve(fullOutputDirPath, jsFileName);

    var fileBuffer = fs.readFileSync(fullInputFilePath);
    var uintArray = Array.from(new Uint8Array(fileBuffer));

    var fileContent =  fluid.stringTemplate(that.options.wrapperTemplate, {
        keys: JSON.stringify(keys),
        content: JSON.stringify(uintArray)
    });
    mkdirp.sync(fullOutputDirPath);
    fs.writeFileSync(fullOutputFilePath, fileContent);
};

youme.tests.midiWrapper();
