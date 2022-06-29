# YouMe UI Components

YouMe provides a number of onscreen components that are intended to control the [core grades](./core-components.md)
provided by this package. These grades extend [`fluid.viewComponent`](https://docs.fluidproject.org/infusion/development/tutorial-gettingstartedwithinfusion/viewcomponents),
which means that to instantiate them, you need to provide them with a selector that corresponds to a piece of existing
markup. See the [demos](../demos) for examples.

## `youme.templateRenderer`

The UI components provided by YouMe make use of the "new view component" infrastructure in Infusion 4.x.  A key
feature is that parent components render their own markup, and then associate child components with elements of the
rendered markup.  Child components render themselves, and the process continues with grandchildren, et cetera.

### Component Options

| Name               | Type       | Description                                                                                                                                                        | Default       |
|--------------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| `markup.container` | `{String}` | A [string template](https://docs.fluidproject.org/infusion/development/coreapi#fluidstringtemplatetemplate-terms) representing the markup for this view component. | Empty string. |

Please note, it is strongly recommended that you have [a single top-level element in your template](https://issues.fluidproject.org/browse/FLUID-6740).

When rendering itself, the component will expose any material in its model for use as a variable.  So, if your component
model contains a `label` variable, you might use a template like `<div class='my-label'>%label</div>` (see below).

These templates do not keep track of updates to model material, you are expected to handle this yourself, as shown in
the following example:

```javascript
var my = fluid.registerNamespace("my");

fluid.defaults("my.widget", {
    gradeNames: ["youme.templateRenderer"],
    markup: {
        container: "<div class='my-label'>%label</div>"
    },
    model: {
        label: "Untitled"
    },
    selectors: {
        label: ".my-label"
    },
    modelListeners: {
        label: {
            // Exclude "init" so that we don't interfere with the initial render.
            excludeSource: "init",
            this: "{that}.dom.label",
            method: "html",
            args: ["{that}.model.label"]
        }
    }
});

var widget = my.widget("body");
widget.applier.change("label", "Titled!");
```

In the above example, the widget will insert itself into the body, and then relay changes to its label model variable to
the onscreen markup.

## `youme.selectBox`

A component that allows selecting a single item from a list.  Wraps an HTML `select` input.

### Component Options

In addition to the options available for a `youme.templateRenderer`, this component supports the following options.

| Name                   | Type              | Description                                                                                                                                                          |
|------------------------|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `markup.optionItem`    | `{String}`        | A [string template](https://docs.fluidproject.org/infusion/development/coreapi#fluidstringtemplatetemplate-terms) representing the markup for each item in the list. |
| `model.label`          | `{String}`        | The label (heading) for this select box.                                                                                                                             |
| `model.selectedItemId` | `{String}`        | The ID of the selected item.                                                                                                                                         |
| `model.optionItems`    | `{Array<Object>}` | An array of objects, each of which should have an `id` and `name` property.                                                                                          |

## `youme.multiSelectBox`

A component that allows selecting one or more items from a list.  Wraps an HTML `select` input with the
[`multiple` attribute](https://www.w3schools.com/tags/att_select_multiple.asp) enabled.

### Component Options

In addition to the options available for a `youme.templateRenderer`, this component supports the following options.

| Name                    | Type              | Description                                                                                                                                                          |
|-------------------------|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `markup.optionItem`     | `{String}`        | A [string template](https://docs.fluidproject.org/infusion/development/coreapi#fluidstringtemplatetemplate-terms) representing the markup for each item in the list. |
| `model.label`           | `{String}`        | The label (heading) for this select box.                                                                                                                             |
| `model.selectedItemIds` | `{Array<String>}` | An array containing the IDs of the selected items.                                                                                                                   |
| `model.optionItems`     | `{Array<Object>}` | An array of objects, each of which should have an `id` and `name` property.                                                                                          |

## `youme.portSelectorView`

A UI component that uses a `youme.selectBox` (see above) to pick a port from the list of available ports, and create
a [`youme.connection`](./core-components.md) for the selected port.  This is the base grade, and should generally not be
used directly.  Instead, you should use `youme.portSelectorView.input` or `youme.portSelectorView.output`.

### Component Options

In addition to the options supported by `youme.templateRenderer`, this component supports the following options:

| Name                   | Type         | Description                                                                                                    | Default          |
|------------------------|--------------|----------------------------------------------------------------------------------------------------------------|------------------|
| `desiredPortSpec`      | `{PortSpec}` | A `PortSpec` object (see above) describing the desired default port.  Will be selected automatically if found. | An empty object. |
| `selectBoxLabel`       | `{String}`   | The onscreen label (heading) for the select box.                                                               | `"MIDI Port:"`   |

## `youme.portSelectorView.input`

Extends `youme.portSelectorView` to work with a MIDIInput.

### Component Options

This component supports the same options as the base grade (`youme.portSelectorView`, see above), but changes the
default label:

| Name             | Type       | Description                                      | Default         |
|------------------|------------|--------------------------------------------------|-----------------|
| `selectBoxLabel` | `{String}` | The onscreen label (heading) for the select box. | `"MIDI Input:"` |

## `youme.portSelectorView.output`

Extends `youme.portSelectorView` to work with a MIDIOutput.

### Component Options

This component supports the same options as the base grade (`youme.portSelectorView`, see above), but changes the
default label:

| Name             | Type       | Description                                      | Default          |
|------------------|------------|--------------------------------------------------|------------------|
| `selectBoxLabel` | `{String}` | The onscreen label (heading) for the select box. | `"MIDI Output:"` |

## `youme.multiPortSelectorView`

A UI component that uses a `youme.multiSelectBox` (see above) to pick on or more ports from the list of available ports,
and create a [`youme.connection`](./core-components.md) for each selected port.  This is the base grade, and should
generally not be used directly.  Instead, you should use `youme.multiPortSelectorView.inputs` or
`youme.multiPortSelectorView.outputs`.

### Component Options

In addition to the options supported by `youme.templateRenderer`, this component supports the following options:

| Name               | Type                | Description                                                                                                                   | Default         |
|--------------------|---------------------|-------------------------------------------------------------------------------------------------------------------------------|-----------------|
| `desiredPortSpecs` | `{Array<PortSpec>}` | An array of one or more `PortSpec` objects (see above) describing the desired port.  Will be selected automatically if found. | An empty array. |
| `selectBoxLabel`   | `{String}`          | The onscreen label (heading) for the select box.                                                                              | `"MIDI Port:"`  |

## `youme.multiPortSelectorView.inputs`

Extends `youme.multiPortSelectorView` to work with one or more MIDIInput ports.

This component supports the same options as the base grade (`youme.multiPortSelectorView`, see above), but changes the
default label:

| Name             | Type       | Description                                      | Default          |
|------------------|------------|--------------------------------------------------|------------------|
| `selectBoxLabel` | `{String}` | The onscreen label (heading) for the select box. | `"MIDI Inputs:"` |

## `youme.multiPortSelectorView.outputs`

Extends `youme.multiPortSelectorView` to work with one or more MIDIOutput ports.

This component supports the same options as the base grade (`youme.multiPortSelectorView`, see above), but changes the
default label:

| Name             | Type       | Description                                      | Default           |
|------------------|------------|--------------------------------------------------|-------------------|
| `selectBoxLabel` | `{String}` | The onscreen label (heading) for the select box. | `"MIDI Outputs:"` |
