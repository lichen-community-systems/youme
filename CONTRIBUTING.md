<!--
   Copyright 2022, Tony Atkins
   Copyright 2011-2020, Colin Clark

   Licensed under the MIT license, see LICENSE for details.
-->
# Contributing to `youme`

Thank you for your interest in contributing to this project. Please read through this page to help you understand what
to expect from the process.

## Code of Conduct

This project is governed by the [Fluid Community's Code of Conduct](https://tinyurl.com/y5q4c6qy). All contributors
are expected to uphold this code.

## Process/Workflow

To contribute a bug report or feature request:

1. Search [our issues](https://github.com/continuing-creativity/youme/issues) to confirm that the issue hasn't already
   been reported.
2. Create a new bug report, following the guidance in the issue template.
3. Discuss the bug report in the ticket and in community forums.

If you would like to contribute a code or documentation change to address and issue:

1. Fork the project repository.
2. Create a branch based on the latest code in the `main` branch.
3. Make the changes described in the associated ticket (see "Coding Guidelines" below).
4. Submit a pull request against the project repository's `main` branch.  If the pull request is meant to resolve a
   known issue, include text like "Resolves #18", "Fixes #28" at the end of the pull request title.
5. Work with reviewers to discuss your changes and address any feedback.

### Coding Guidelines

The code in this package is informed by the
[Coding and Commit Standards](https://wiki.fluidproject.org/display/fluid/Coding+and+Commit+Standards) for the wider
Fluid community.  It is generally expected that changes will:

1. Provide meaningful commit messages (see below).
2. Include tests verifying the changes (see below).
3. Pass the linting checks used in this package (see below).
4. Update or add markdown documentation for API changes.
5. Provide [JSDocs](https://jsdoc.app) for new functions.
6. Provide comments explaining the purpose of new components and other non-functions.

#### Commit Messages

All commit log messages should include the following information:

1. A reference to the GitHub issue this commit applies to (at the beginning of the first line).
2. A meaningful, but short description of the change.

A good commit message might look like:

```shell
commit -am "GH-12: Initial implementation of neutron flow reversal."

commit -am "GH-12: Added JSDocs based on PR feedback."
```

#### Tests

The tests for this package are currently written using
[jqUnit](https://docs.fluidproject.org/infusion/development/jqUnit.html), and run in supported browsers using
[`fluid-testem`](https://github.com/fluid-project/fluid-testem).

#### Lint Your Code

This package makes use of the standard linting package and configuration used within the Fluid community.  This helps
ensure that the code and documentation in the package are consistent, readable, and free from basic errors.  After you
have installed this package's dependencies, you can run the linting using a command like `npm run lint`.

In general, you are expected to contribute code that passes the linting checks.  Many times this is done by simply
writing code that passes the existing checks, but the checks are not rigid, and are meant to evolve to meet the
community's needs.

If you find that you are having trouble satisfying one or more checks, talk with your reviewers and/or the wider
community.  Each of the linting checks we use are highly configurable, and we are open to changing the configuration
and/or excluding code from particular checks as needed.

## Security

All dependencies used in this project are monitored to ensure that we are aware
of and fix security issues that would affect our end users.  For this purpose
we use [npm-audit-resolver](https://www.npmjs.com/package/npm-audit-resolver).
All pulls are checked to ensure that they do not introduce security
dependencies.  If you are adding a new dependency (development or otherwise),
it is recommended that you check for security issues using a command like
the following:

```shell
node node_modules/.bin/check-audit
```

This script ignores known issues found in the `audit-resolve.json` file in the
root of the repository.  If, after reviewing the output of `check-audit`, the
team is able to determine that a dependency does not pose a risk to end users
(for example because it is only used as part of the build chain), a security
issue can be excluded from further checks using a command like the following:

```shell
node node_modules/.bin/resolve-audit
```
