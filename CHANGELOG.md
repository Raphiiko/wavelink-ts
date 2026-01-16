# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-16

### Added

- Added `mainOutputDeviceChanged` event - fires when the main output device changes
- Added `MainOutput` interface to properly type the main output device information
- Added documentation for `dspEffects` property on inputs (hardware effects vs software effects)

### Changed

- **BREAKING**: Changed `mainOutput` type from `string` to `MainOutput` object with `outputDeviceId` property
- Updated library to support Wave Link 3.0 Beta Update 4 (previously Beta Update 3)
- `mainOutputDeviceChanged` event is now derived from `outputDevicesChanged` by comparing mainOutput values

### Fixed

- Fixed `mainOutput` type to match actual Wave Link API response structure

## [1.2.0] - 2026-01-12

### Added

- Added `name` property to `InputDevice` interface - displays the device's human-readable name
- Added `name` property to `Input` interface - displays the input's human-readable name
- Added `name` property to `OutputDevice` interface - displays the device's human-readable name
- Added `name` property to `Output` interface - displays the output's human-readable name
- Added `name` property to `Channel` interface - displays the channel's human-readable name
- Added `name` property to `Effect` interface - displays the effect's human-readable name
- Added `isWaveDevice` property to `InputDevice` interface - identifies Elgato Wave devices
- Added `isWaveDevice` property to `OutputDevice` interface - identifies Elgato Wave devices
- Added `isGainLockOn` optional property to `Input` interface - indicates if gain lock is enabled
- Added `min` and `max` optional properties to `Input.gain` - provides gain range information
- Added `micPcMix.isInverted` optional property to `Input` interface - indicates if mic/PC mix is inverted

### Changed

- Made `Input.micPcMix` optional as it's only available on Elgato Wave devices
- Made `Input.gain.min`, `Input.gain.max`, and `Input.gain.maxRange` optional properties

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
