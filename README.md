# Wave Link TS

A TypeScript library for controlling Elgato Wave Link 3.0 programmatically. It has been reverse engineered from Elgato's Wave Link plugin for Stream Deck.

Note that this library is based on Wave Link 3.0 Beta Update 3. Keep in mind things might break with future Wave Link updates.

## Installation

```bash
npm install @raphiiko/wavelink-ts
```

Or with your preferred package manager:

```bash
# Bun
bun add @raphiiko/wavelink-ts

# Yarn
yarn add @raphiiko/wavelink-ts

# pnpm
pnpm add @raphiiko/wavelink-ts
```

## Quick Start

### With Bun (Recommended)

Bun can run TypeScript directly without a build step:

```bash
bun examples/basic.ts
```

### With Node.js

Requires building first:

```bash
npm run build
node examples/basic-compiled.js
```

### Basic Usage

```typescript
import { WaveLinkClient } from "@raphiiko/wavelink-ts";

const client = new WaveLinkClient();

// Connect to Wave Link
await client.connect();

// Get all channels
const { channels } = await client.getChannels();
console.log("Channels:", channels);

// Mute a channel
await client.setChannelMute("my-channel-id", true);

// Set volume (0.0 - 1.0)
await client.setChannelVolume("my-channel-id", 0.5);

// Listen for changes
client.on("channelChanged", (channel) => {
  console.log("Channel updated:", channel.id);
});

// Disconnect when done
client.disconnect();
```

## API Overview

### Connection

```typescript
const client = new WaveLinkClient({
  host: "127.0.0.1", // Default
  autoReconnect: true, // Default
  reconnectDelay: 2000, // Default (ms)
  maxReconnectAttempts: 10, // Default
});

await client.connect();
```

The client automatically tries ports 1884-1893 until a connection is established.

### Getting State

```typescript
// Get application info
const info = await client.getApplicationInfo();

// Get all channels (audio sources)
const { channels } = await client.getChannels();

// Get all mixes (output configurations)
const { mixes } = await client.getMixes();

// Get input devices (microphones, etc.)
const { inputDevices } = await client.getInputDevices();

// Get output devices (speakers, headphones, etc.)
const { mainOutput, outputDevices } = await client.getOutputDevices();
```

### Controlling Channels

Channels represent audio sources (applications, hardware inputs, etc.):

```typescript
// Mute/unmute
await client.setChannelMute("channel-id", true);

// Set overall volume (0.0 - 1.0)
await client.setChannelVolume("channel-id", 0.75);

// Toggle mute
await client.toggleChannelMute("channel-id");

// Set volume for specific mix
await client.setChannelMixVolume("channel-id", "stream-mix-id", 0.5);

// Mute in specific mix only
await client.setChannelMixMute("channel-id", "stream-mix-id", true);
```

### Controlling Mixes

Mixes are output configurations (Stream Mix, Monitor Mix, etc.):

```typescript
// Set master volume
await client.setMixVolume("mix-id", 0.9);

// Mute/unmute
await client.setMixMute("mix-id", true);

// Toggle mute
await client.toggleMixMute("mix-id");
```

### Controlling Inputs

```typescript
// Set input gain (0.0 - 1.0)
await client.setInputGain("device-id", "input-id", 0.8);

// Mute/unmute input
await client.setInputMute("device-id", "input-id", true);
```

### Controlling Outputs

```typescript
// Set output volume
await client.setOutputVolume("device-id", "output-id", 0.8);

// Switch output to different mix
await client.switchOutputMix("device-id", "output-id", "monitor-mix-id");

// Remove output from all mixes
await client.removeOutputFromMix("device-id", "output-id");
```

### Events

The client emits events for all state changes:

```typescript
client.on("connected", () => {
  console.log("Connected to Wave Link");
});

client.on("disconnected", () => {
  console.log("Disconnected from Wave Link");
});

client.on("error", (error) => {
  console.error("Error:", error);
});

// Channel events
client.on("channelChanged", (channel) => {
  console.log("Channel changed:", channel);
});

client.on("channelsChanged", (result) => {
  console.log("All channels updated:", result.channels);
});

// Mix events
client.on("mixChanged", (mix) => {
  console.log("Mix changed:", mix);
});

// Input/output events
client.on("inputDeviceChanged", (device) => {
  console.log("Input device changed:", device);
});

client.on("outputDeviceChanged", (device) => {
  console.log("Output device changed:", device);
});
```

### Subscriptions

Subscribe to receive additional notifications:

```typescript
// Subscribe to focused app changes
await client.subscribeFocusedApp(true);
client.on("focusedAppChanged", ({ appId, appName, channel }) => {
  console.log(`${appName} is now focused`);
});

// Subscribe to level meters (audio levels)
await client.subscribeLevelMeter("channel", "channel-id", true);
client.on("levelMeterChanged", ({ channels }) => {
  console.log("Audio levels:", channels);
});
```

## Examples

All examples can be run with Bun (no build needed) or Node.js (requires `npm run build` first):

```bash
# With Bun
bun examples/basic.ts

# With Node.js
npm run build && node dist/examples/basic.js
```

### Available Examples

1. **`basic.ts`** - Connection and getting state
   - Connect to Wave Link
   - Get application info
   - List all channels, mixes, inputs, and outputs

2. **`channels.ts`** - Controlling channels
   - Set channel volume (overall and per-mix)
   - Mute/unmute channels (overall and per-mix)
   - Toggle mute
   - Set multiple properties at once

3. **`mixes.ts`** - Controlling mixes
   - Set mix master volume
   - Mute/unmute mixes
   - Toggle mix mute

4. **`outputs.ts`** - Controlling outputs
   - Set output volume
   - Switch output between mixes
   - Remove output from all mixes

5. **`events.ts`** - Listening for changes
   - Connection events
   - Channel/mix change events
   - Input/output change events
   - Focused app changes (requires subscription)

## Protocol Documentation

For low-level protocol details, see [PROTOCOL.md](./PROTOCOL.md). It documents:

- JSON-RPC 2.0 message format
- All 11 RPC methods
- All 10 notification types
- Connection details
- Raw request/response examples

## Project Structure

```
wavelink-api/
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # WaveLinkClient class
│   ├── types.ts              # TypeScript type definitions
│   └── websocket-adapter.ts  # Bun/Node.js WebSocket adapter
├── examples/
│   ├── basic.ts              # Connection and getting state
│   ├── channels.ts           # Controlling channels
│   ├── mixes.ts              # Controlling mixes
│   └── events.ts             # Listening for changes
├── dist/                     # Compiled output (after npm run build)
├── protocol.md               # Low-level protocol documentation
└── README.md                 # This file
```

## How It Works

Wave Link runs a WebSocket server on port 1884 (with fallback ports 1885-1893) that uses JSON-RPC 2.0 for communication. This server is used by the Stream Deck plugin for control.

The library:

1. Automatically tries to connect on ports 1884-1893 with origin `streamdeck://`
2. Sends JSON-RPC requests to control Wave Link
3. Receives JSON-RPC notifications for state changes
4. Automatically detects Bun vs Node.js and uses the appropriate WebSocket implementation

## Requirements

- **Wave Link 3.0 Beta** must be running
- **Node.js 18+** or **Bun 1.0+**

## Runtime Support

The library automatically detects the runtime and uses:

- **Bun**: Native WebSocket API (faster, no dependencies)
- **Node.js**: `ws` package (reliable, battle-tested)

This is transparent to users - the API is identical regardless of runtime.

## Troubleshooting

### Connection fails

**Problem**: `Error: WebSocket connection failed`

**Solutions**:

1. Make sure Wave Link is running
2. The client automatically tries ports 1884-1893, so port conflicts are usually handled automatically
3. Try restarting Wave Link
4. Check that no firewall is blocking localhost connections

### Channel IDs are weird

Wave Link auto-generates channel IDs like `PCM_OUT_00_V_10_SD6` or `{0.0.1.00000000}.{guid}`. To find your channel IDs, run:

```bash
bun examples/basic.ts
```

This will list all available channels and mixes with their IDs.

### Can't control specific application

Wave Link organizes applications into channels automatically. You control the channel, not individual applications. Use `addToChannel()` to move applications between channels.

## License

MIT

## Disclaimer

This is an unofficial library and is not affiliated with or endorsed by Elgato or Corsair.
