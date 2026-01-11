# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-11

### Added

- New `removeOutputFromMix()` method to remove an output from all mixes without assigning it to another one
- New example file `examples/outputs.ts` demonstrating output control including volume, switching mixes, and removing from mixes

### Changed

- Updated README with documentation for the new `removeOutputFromMix()` method
- Updated examples list in README to include the new outputs example

## [1.0.0] - 2026-01-11

### Added

- Initial release
- TypeScript library for controlling Elgato Wave Link 3.0
- Support for all Wave Link RPC methods
- Event system for state change notifications
- Automatic port detection (1884-1893)
- Automatic reconnection support
- Comprehensive type definitions
- Example files for common use cases
- Protocol documentation in PROTOCOL.md
