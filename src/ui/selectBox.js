/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

/*

    Infusion > 4.0 compatible select box. Designed to work with a map of items.

*/
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    // A select box component that relays changes in the selected value, but that has to be redrawn when the list of
    // available options changes.
    fluid.defaults("youme.selectBox", {
        gradeNames: ["fluid.containerRenderingView"],

        injectionType: "html",

        selectors: {
            label: ".youme-select-label",
            selectBox: ".youme-select"
        },

        markup: {
            // There must be a single top-level element, see https://issues.fluidproject.org/browse/FLUID-6740
            container: "<div class='youme-select-container'><h3 class='youme-select-label'>%label</h3><select class='youme-select'>%optionsContent</select></div>",
            optionItem: "<option value='%id' %selected>%name</option>\n"
        },

        includeNone: true,
        noneLabel: "Select an Option",

        model: {
            label: "",
            selectedItemId: false,
            optionItems: {}
        },

        invokers: {
            renderMarkup: {
                funcName: "youme.selectBox.render",
                args: ["{that}", "{that}.options.markup.container"] // containerTemplate
            },
            renderOptions: {
                funcName: "youme.selectBox.renderOptions",
                args: ["{that}", "{that}.options.markup.optionItem" ] // itemTemplate
            }
        },
        listeners: {
            "onCreate.bind": {
                this: "{that}.dom.selectBox",
                method: "change",
                args: ["{that}.handleSelectChange"]
            }
        },
        modelListeners: {
            selectBoxRefresh: {
                excludeSource: "init",
                path: ["selectedItemId", "optionItems"],
                this: "{that}.dom.selectBox",
                method: "html",
                args: ["@expand:{that}.renderOptions()"]
            },
            label: {
                excludeSource: "init",
                this: "{that}.dom.label",
                method: "html",
                args: ["{that}.model.label"]
            }
        },
        modelRelay: {
            bindValue: {
                source: "dom.selectBox.value",
                target: "selectedItemId"
            }
        }
    });

    youme.selectBox.renderOptions = function (that, itemTemplate) {
        var optionsContent = "";

        if (that.options.includeNone) {
            optionsContent += fluid.stringTemplate(itemTemplate, { id: "none", name: that.options.noneLabel });
        }

        fluid.each(that.model.optionItems, function (optionItem) {
            var selected = optionItem.id === that.model.selectedItemId ? "selected" : "";
            var mergedItemVariables = fluid.extend({}, optionItem, { selected: selected});
            optionsContent += fluid.stringTemplate(itemTemplate, mergedItemVariables);
        });
        return optionsContent;
    };

    youme.selectBox.render = function (that, containerTemplate) {
        var optionsContent = that.renderOptions();

        var mergedContainerVariables = fluid.extend({}, that.model, { optionsContent: optionsContent});
        var renderedContent = fluid.stringTemplate(containerTemplate, mergedContainerVariables);
        return renderedContent;
    };
})(fluid);
