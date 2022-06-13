<!--
   Copyright 2022, Tony Atkins
   Copyright 2011-2020, Colin Clark

   Licensed under the MIT license, see LICENSE for details.
-->
# `youme.system`

This component interfaces with the WebMIDI API, keeping track of ports, and opening and closing connections.  It is
used by nearly every other grade in this package.  

This component is a "root single" grade, meaning that there will only ever be one active at a given time.  See
[the infusion documentation](https://docs.fluidproject.org/infusion/development/contexts#global-components-fluidresolveroot-and-fluidresolverootsingle)
for more information.  If you write a grade that uses `youme.system` as a sub-component, be aware that it is not
advisable to pass options.  Depending on the order in which other components are created, your options may be applied
by an instance of `youme.system` that is no longer active.

## Invokers

## Model Variables
