/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

/* eslint-env node */
// The main file that is included when you run `require("fluid-midi")`.
"use strict";
var fluid = require("infusion");

require("./src/core");
require("./src/messageEventHolders");
require("./src/connection");
require("./src/portConnector");
require("./src/system");

// Register our content so it can be used with calls like fluid.module.resolvePath("%fluid-midi/path/to/content.js");
fluid.module.register("youme", __dirname, require);
