# ADR-004. Deliver one HTML file

Status: Accepted. Date: 2026-10-09.

## Context

Users need a simple way to get and run the tool. Some users want to run it with no internet connection.

## Options

| Option | For | Against |
|---|---|---|
| **A. One self-contained HTML file** | Double-click to run; works offline; one hash to verify; easy to host anywhere | All code in one file (the build joins it) |
| B. A website with many files | Normal web structure | Needs a server; harder to verify; harder to use offline |
| C. A browser extension | Always available | Store review; extension permissions are a large attack surface; one version per browser |
| D. A mobile app | Familiar for phone users | App store fees and review; two code bases; harder to audit |
| E. A command-line tool | Good for experts | Most users cannot use a terminal |

## Decision

Option A.

## Reasons

- One file has one SHA-256 hash. Users can verify it in one step.
- The same file works from a disk, from a web host, and from the NosisTech website.

## Consequences

- The build script joins the modules ([ADR-005](ADR-005-build-script.md)).
- The file must stay small. It is about 300 KB now, of which the embedded font is a third.
