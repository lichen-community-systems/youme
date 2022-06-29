/*
 * Copyright 2022, Tony Atkins
 * Copyright 2011-2020, Colin Clark
 *
 *  Licensed under the MIT license, see LICENSE for details.
 */

/*

    Infusion > 4.0 compatible multi select box. Designed to work with a map of items.

*/
(function (fluid) {
    "use strict";
    var youme = fluid.registerNamespace("youme");

    // A select box component that relays changes in the selected value, but that has to be redrawn when the list of
    // available options changes.
    fluid.defaults("youme.multiSelectBox", {
        gradeNames: ["fluid.containerRenderingView"],

        injectionType: "html",

        selectors: {
            label: ".youme-select-label",
            multiSelectBox: ".youme-multi-select"
        },

        markup: {
            container: "<div class='youme-select-container'><h3 class='youme-select-label'>%label</h3><select class='youme-multi-select' multiple>\n%optionsContent\n</select></div>",
            optionItem: "<option value='%id' %selected>%name</option>\n"
        },

        model: {
            label: "",
            selectedItemIds: [],
            optionItems: {}
        },

        invokers: {
            handleSelectChange: {
                funcName: "youme.multiSelectBox.handleSelectChange",
                args: ["{that}"]
            },
            renderMarkup: {
                funcName: "youme.multiSelectBox.render",
                args: ["{that}", "{that}.options.markup.container"] // containerTemplate
            },
            renderOptions: {
                funcName: "youme.multiSelectBox.renderOptions",
                args: ["{that}", "{that}.options.markup.optionItem" ] // itemTemplate
            }
        },
        listeners: {
            "onCreate.bind": {
                this: "{that}.dom.multiSelectBox",
                method: "change",
                args: ["{that}.handleSelectChange"]
            }
        },
        modelListeners: {
            selectBoxRefresh: {
                excludeSource: "init",
                path: ["selectedItemIds", "optionItems"],
                this: "{that}.dom.multiSelectBox",
                method: "html",
                args: ["@expand:{that}.renderOptions()"]
            },
            label: {
                excludeSource: "init",
                this: "{that}.dom.label",
                method: "html",
                args: ["{that}.model.label"]
            }
        }
    });

    youme.multiSelectBox.render = function (that, containerTemplate) {
        var optionsContent = that.renderOptions();

        var mergedContainerVariables = fluid.extend({}, that.model, { optionsContent: optionsContent});
        var renderedContent = fluid.stringTemplate(containerTemplate, mergedContainerVariables);
        return renderedContent;
    };

    youme.multiSelectBox.renderOptions = function (that, itemTemplate) {
        var optionsContent = "";
        fluid.each(that.model.optionItems, function (optionItem) {
            var selected = that.model.selectedItemIds.includes(optionItem.id) ? "selected" : "";
            var mergedItemVariables = fluid.extend({}, optionItem, { selected: selected});
            optionsContent += fluid.stringTemplate(itemTemplate, mergedItemVariables);
        });
        return optionsContent;
    };

    youme.multiSelectBox.handleSelectChange = function (that) {
        var selectElement = that.locate("multiSelectBox");
        var newSelectedItemIds = selectElement.val();
        that.applier.change("selectedItemIds", newSelectedItemIds);
    };
})(fluid);
