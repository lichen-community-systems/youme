/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

/* eslint-env node */
"use strict";
var fluid = require("infusion");
var youme = fluid.registerNamespace("youme");

fluid.require("%fluid-testem");
fluid.require("%youme");

// TODO: Replace this once fluid-testem adds the ability to disable instrumentation with a flag.
fluid.defaults("youme.tests.testem", {
    gradeNames: ["fluid.component", "fluid.contextAware"],
    contextAwareness: {
        shouldInstrument: {
            checks: {
                shouldInstrument: {
                    contextValue: "{youme.tests.testem.shouldInstrument}",
                    gradeNames: "fluid.testem"
                }
            },
            defaultGradeNames: "fluid.testem.base"
        }
    }
});

youme.tests.testem.shouldInstrument = function () {
    return process.env.DISABLE_INSTRUMENTATION ? false : true;
};

fluid.contextAware.makeChecks({
    "youme.tests.testem.shouldInstrument": "youme.tests.testem.shouldInstrument"
});


var testemComponent = youme.tests.testem({
    testPages: [
        "tests/all-tests.html"
    ],
    sourceDirs: {
        src: "%youme/src"
    },
    coverageDir: "%youme/coverage",
    reportsDir: "%youme/reports",
    contentDirs: {
        tests: "%youme/tests",
        node_modules: "%youme/node_modules"
    },
    testemOptions: {
        skip: "IE,Safari,Firefox,Headless Firefox"
    },
    coveragePort: 7017
});

module.exports = testemComponent.getTestemOptions();
