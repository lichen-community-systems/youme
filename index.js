/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

/* eslint-env node */
// The main file that is included when you run `require("youme")`.
"use strict";
var fluid = require("infusion");

require("./src/js/core");
require("./src/js/messageEventHolders");
require("./src/js/connection");
require("./src/js/portConnector");
require("./src/js/system");

// Register our content so it can be used with calls like fluid.module.resolvePath("%youme/path/to/content.js");
fluid.module.register("youme", __dirname, require);
