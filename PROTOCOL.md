# Elgato Wave Link 3.0 Protocol Documentation

This document describes the protocol for Wave Link 3.0's RPC.

## Overview

Wave Link 3.0 uses JSON-RPC 2.0 over WebSocket for all communication.

**Connection Details:**

- **Protocol**: JSON-RPC 2.0 over WebSocket
- **Host**: `ws://127.0.0.1`
- **Port**: 1884 (default, with fallback to ports 1885-1893)
- **Origin Header**: `streamdeck://`
- **Authentication**: None required

## JSON-RPC 2.0 Format

### Request Structure

All requests follow the JSON-RPC 2.0 specification:

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "method": "methodName",
  "params": {}
}
```

- `id`: Incrementing number for tracking requests/responses
- `jsonrpc`: Always `"2.0"`
- `method`: The RPC method name
- `params`: Method parameters (can be `null` or `{}` for methods with no parameters)

### Response Structure

Successful responses:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {}
}
```

Error responses:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Error description",
    "data": {}
  }
}
```

### Notification Structure

Notifications are server-initiated messages (no `id` field):

```json
{
  "jsonrpc": "2.0",
  "method": "notificationMethod",
  "params": {}
}
```

## RPC Methods

These methods are sent from the client to Wave Link.

### `getApplicationInfo`

Get application information and verify connection.

**Request:**

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "method": "getApplicationInfo",
  "params": null
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "appID": "EWL",
    "name": "Elgato Wave Link",
    "interfaceRevision": 1
  }
}
```

**Notes:**

- `interfaceRevision` must be >= 1 for compatibility
- Use this method first to verify connection

---

### `getInputDevices`

Get all audio input devices and their properties.

**Request:**

```json
{
  "id": 2,
  "jsonrpc": "2.0",
  "method": "getInputDevices",
  "params": null
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "inputDevices": [
      {
        "id": "wave3_usb_microphone",
        "isWaveDevice": true,
        "inputs": [
          {
            "id": "wave3_input_1",
            "isMuted": false,
            "gain": {
              "value": 0.5,
              "maxRange": 100
            },
            "micPcMix": {
              "value": 0.5
            },
            "effects": [
              {
                "id": "clipguard",
                "isEnabled": true
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Field Descriptions:**

- `id`: Unique device identifier
- `isWaveDevice`: Whether this is an Elgato Wave device (has special features)
- `inputs[]`: Array of input channels on this device
  - `isMuted`: Whether input is muted
  - `gain.value`: Gain level (0.0-1.0, normalized by maxRange)
  - `gain.maxRange`: Maximum gain range for the device
  - `micPcMix.value`: Mix between microphone and PC audio (0.0-1.0)
  - `effects[]`: Available effects and their states (Wave devices only)
  - `dspEffects[]`: Alternative effects array (some devices)

---

### `getOutputDevices`

Get all audio output devices and their properties.

**Request:**

```json
{
  "id": 3,
  "jsonrpc": "2.0",
  "method": "getOutputDevices",
  "params": null
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "mainOutput": "speakers_main",
    "outputDevices": [
      {
        "id": "speakers_main",
        "outputs": [
          {
            "id": "output_1",
            "level": 0.8,
            "isMuted": false,
            "mixId": "stream_mix"
          }
        ]
      }
    ]
  }
}
```

**Field Descriptions:**

- `mainOutput`: ID of the main output device
- `outputDevices[]`: Array of output devices
  - `outputs[]`: Output channels on this device
    - `level`: Output volume (0.0-1.0)
    - `isMuted`: Whether output is muted
    - `mixId`: Currently selected mix for this output

---

### `getChannels`

Get all channels (audio sources) in the mixer.

**Request:**

```json
{
  "id": 4,
  "jsonrpc": "2.0",
  "method": "getChannels",
  "params": null
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "channels": [
      {
        "id": "spotify",
        "type": "Software",
        "isMuted": false,
        "level": 0.75,
        "image": {
          "name": "spotify",
          "imgData": "data:image/png;base64,..."
        },
        "apps": [
          {
            "id": "com.spotify.music",
            "name": "Spotify"
          }
        ],
        "mixes": [
          {
            "id": "stream_mix",
            "level": 0.8,
            "isMuted": false
          },
          {
            "id": "monitor_mix",
            "level": 0.6,
            "isMuted": false
          }
        ]
      }
    ]
  }
}
```

**Field Descriptions:**

- `id`: Channel identifier
- `type`: `"Software"` or `"Hardware"`
- `isMuted`: Overall channel mute
- `level`: Overall channel volume (0.0-1.0)
- `image`: Icon/image for the channel
- `apps[]`: Applications assigned to this channel
- `effects[]`: Effects available for this channel (optional)
- `mixes[]`: Per-mix settings for this channel
  - Each channel has separate volume and mute per mix

---

### `getMixes`

Get all mixer configurations (Stream Mix, Monitor Mix, etc.).

**Request:**

```json
{
  "id": 5,
  "jsonrpc": "2.0",
  "method": "getMixes",
  "params": null
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "mixes": [
      {
        "id": "stream_mix",
        "name": "Stream Mix",
        "level": 1.0,
        "isMuted": false,
        "image": {
          "name": "stream"
        }
      },
      {
        "id": "monitor_mix",
        "name": "Monitor Mix",
        "level": 0.9,
        "isMuted": false,
        "image": {
          "name": "monitor"
        }
      }
    ]
  }
}
```

**Field Descriptions:**

- `id`: Mix identifier
- `name`: Human-readable mix name
- `level`: Master output level for this mix (0.0-1.0)
- `isMuted`: Master mute for this mix

---

### `setInputDevice`

Modify input device properties.

**Request:**

```json
{
  "id": 6,
  "jsonrpc": "2.0",
  "method": "setInputDevice",
  "params": {
    "id": "wave3_usb_microphone",
    "inputs": [
      {
        "id": "wave3_input_1",
        "isMuted": true
      }
    ]
  }
}
```

**Example: Adjust Gain**

```json
{
  "id": 7,
  "jsonrpc": "2.0",
  "method": "setInputDevice",
  "params": {
    "id": "wave3_usb_microphone",
    "inputs": [
      {
        "id": "wave3_input_1",
        "gain": {
          "value": 0.75
        }
      }
    ]
  }
}
```

**Example: Toggle Effect**

```json
{
  "id": 8,
  "jsonrpc": "2.0",
  "method": "setInputDevice",
  "params": {
    "id": "wave3_usb_microphone",
    "inputs": [
      {
        "id": "wave3_input_1",
        "effects": [
          {
            "id": "clipguard",
            "isEnabled": false
          }
        ]
      }
    ]
  }
}
```

**Notes:**

- Only include properties you want to change
- Response is typically empty on success

---

### `setOutputDevice`

Modify output device properties.

**Request:**

```json
{
  "id": 9,
  "jsonrpc": "2.0",
  "method": "setOutputDevice",
  "params": {
    "outputDevice": {
      "id": "speakers_main",
      "outputs": [
        {
          "id": "output_1",
          "level": 0.5
        }
      ]
    }
  }
}
```

**Example: Switch Mix**

```json
{
  "id": 10,
  "jsonrpc": "2.0",
  "method": "setOutputDevice",
  "params": {
    "outputDevice": {
      "id": "speakers_main",
      "outputs": [
        {
          "id": "output_1",
          "mixId": "monitor_mix"
        }
      ]
    }
  }
}
```

**Example: Mute Output**

```json
{
  "id": 11,
  "jsonrpc": "2.0",
  "method": "setOutputDevice",
  "params": {
    "outputDevice": {
      "id": "speakers_main",
      "outputs": [
        {
          "id": "output_1",
          "isMuted": true
        }
      ]
    }
  }
}
```

---

### `setChannel`

Modify channel (audio source) properties.

**Request:**

```json
{
  "id": 12,
  "jsonrpc": "2.0",
  "method": "setChannel",
  "params": {
    "id": "spotify",
    "isMuted": true
  }
}
```

**Example: Set Volume for Specific Mix**

```json
{
  "id": 13,
  "jsonrpc": "2.0",
  "method": "setChannel",
  "params": {
    "id": "spotify",
    "mixes": [
      {
        "id": "stream_mix",
        "level": 0.5
      }
    ]
  }
}
```

**Example: Set Overall Volume**

```json
{
  "id": 14,
  "jsonrpc": "2.0",
  "method": "setChannel",
  "params": {
    "id": "spotify",
    "level": 0.8
  }
}
```

**Example: Mute in Specific Mix**

```json
{
  "id": 15,
  "jsonrpc": "2.0",
  "method": "setChannel",
  "params": {
    "id": "spotify",
    "mixes": [
      {
        "id": "stream_mix",
        "isMuted": true
      }
    ]
  }
}
```

**Notes:**

- `level`: Overall channel volume
- `mixes[]`: Per-mix volume and mute settings
- Only include the properties/mixes you want to change

---

### `setMix`

Modify mixer configuration properties.

**Request:**

```json
{
  "id": 16,
  "jsonrpc": "2.0",
  "method": "setMix",
  "params": {
    "id": "stream_mix",
    "level": 0.9
  }
}
```

**Example: Mute Mix**

```json
{
  "id": 17,
  "jsonrpc": "2.0",
  "method": "setMix",
  "params": {
    "id": "stream_mix",
    "isMuted": true
  }
}
```

---

### `addToChannel`

Add an application to a specific channel.

**Request:**

```json
{
  "id": 18,
  "jsonrpc": "2.0",
  "method": "addToChannel",
  "params": {
    "appId": "com.discord.app",
    "channelId": "comms"
  }
}
```

---

### `setSubscription`

Subscribe to notifications/events.

**Request: Subscribe to Focused App Changes**

```json
{
  "id": 19,
  "jsonrpc": "2.0",
  "method": "setSubscription",
  "params": {
    "focusedAppChanged": {
      "isEnabled": true
    }
  }
}
```

**Request: Subscribe to Level Meter Updates**

```json
{
  "id": 20,
  "jsonrpc": "2.0",
  "method": "setSubscription",
  "params": {
    "levelMeterChanged": {
      "type": "channel",
      "id": "spotify",
      "isEnabled": true
    }
  }
}
```

**Level Meter Types:**

- `"input"`: Input device level meters
- `"output"`: Output device level meters
- `"channel"`: Channel level meters
- `"mix"`: Mix level meters

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "result": {
    "levelMeterChanged": {
      "type": "channel",
      "id": "spotify",
      "isEnabled": true
    }
  }
}
```

---

## Notifications

Notifications are sent from Wave Link to the client without a request `id`.

### `inputDevicesChanged`

All input devices changed (complete list).

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "inputDevicesChanged",
  "params": {
    "inputDevices": [
      // Same structure as getInputDevices response
    ]
  }
}
```

---

### `inputDeviceChanged`

A specific input device changed.

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "inputDeviceChanged",
  "params": {
    "id": "wave3_usb_microphone",
    "inputs": [
      {
        "id": "wave3_input_1",
        "isMuted": true
        // Only changed properties are included
      }
    ]
  }
}
```

---

### `outputDevicesChanged`

All output devices changed (complete list).

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "outputDevicesChanged",
  "params": [
    "speakers_main",
    [
      // Array of output devices (same structure as getOutputDevices)
    ]
  ]
}
```

**Note:** The params is an array: `[mainOutput, outputDevices]`

---

### `outputDeviceChanged`

A specific output device changed.

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "outputDeviceChanged",
  "params": {
    "id": "speakers_main"
    // Only changed properties are included
  }
}
```

---

### `channelsChanged`

All channels changed (complete list).

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "channelsChanged",
  "params": {
    "channels": [
      // Same structure as getChannels response
    ]
  }
}
```

---

### `channelChanged`

A specific channel changed.

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "channelChanged",
  "params": {
    "id": "spotify",
    "isMuted": true
    // Only changed properties are included
  }
}
```

---

### `mixesChanged`

All mixes changed (complete list).

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "mixesChanged",
  "params": {
    "mixes": [
      // Same structure as getMixes response
    ]
  }
}
```

---

### `mixChanged`

A specific mix changed.

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "mixChanged",
  "params": {
    "id": "stream_mix",
    "level": 0.8
    // Only changed properties are included
  }
}
```

---

### `levelMeterChanged`

Level meter values updated (requires subscription via `setSubscription`).

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "levelMeterChanged",
  "params": [
    [], // Input devices meters
    [], // Output devices meters
    [
      // Channel meters
      {
        "id": "spotify",
        "left": 0.5,
        "right": 0.5
      }
    ],
    [] // Mix meters
  ]
}
```

**Notes:**

- The params is an array of 4 arrays: `[inputs, outputs, channels, mixes]`
- Each meter object format varies by type
- This notification fires frequently (real-time audio levels)

---

### `focusedAppChanged`

The currently focused application changed (requires subscription).

**Notification:**

```json
{
  "jsonrpc": "2.0",
  "method": "focusedAppChanged",
  "params": [
    "com.spotify.music",
    "Spotify",
    {
      "id": "spotify"
    }
  ]
}
```

**Note:** The params is an array: `[appId, appName, { id: channelId }]`

---

## Common Patterns

### Initial Connection

1. Connect to WebSocket: `ws://127.0.0.1:1884`
2. Call `getApplicationInfo` to verify connection
3. Call `getInputDevices`, `getOutputDevices`, `getChannels`, `getMixes` to get current state
4. Subscribe to relevant notifications

**Example Connection Flow:**

```javascript
const ws = new WebSocket("ws://127.0.0.1:1884", { origin: "streamdeck://" });

ws.on("open", () => {
  // 1. Verify connection
  send({ id: 1, jsonrpc: "2.0", method: "getApplicationInfo", params: null });

  // 2. Get initial state
  send({ id: 2, jsonrpc: "2.0", method: "getInputDevices", params: null });
  send({ id: 3, jsonrpc: "2.0", method: "getOutputDevices", params: null });
  send({ id: 4, jsonrpc: "2.0", method: "getChannels", params: null });
  send({ id: 5, jsonrpc: "2.0", method: "getMixes", params: null });

  // 3. Subscribe to changes
  send({
    id: 6,
    jsonrpc: "2.0",
    method: "setSubscription",
    params: { focusedAppChanged: { isEnabled: true } },
  });
});
```

### Volume Control

All volume/level values are in the range 0.0 to 1.0:

- `0.0` = Silent (0%)
- `0.5` = 50%
- `1.0` = Maximum (100%)

### Gain Control

Input gain is normalized by the device's `maxRange`:

- Get current gain: `gain.value` (0.0-1.0)
- Get max range: `gain.maxRange`
- Actual dB or raw value: `gain.value * gain.maxRange`

### Partial Updates

When calling setter methods (`setChannel`, `setMix`, etc.), you only need to include the properties you want to change. Other properties remain unchanged.

**Example: Only mute a channel without changing volume**

```json
{
  "id": 100,
  "jsonrpc": "2.0",
  "method": "setChannel",
  "params": {
    "id": "spotify",
    "isMuted": true
  }
}
```

### Per-Mix Control

Channels have both overall settings and per-mix settings:

- `level`: Overall volume (affects all mixes proportionally)
- `isMuted`: Overall mute (mutes in all mixes)
- `mixes[].level`: Volume for specific mix
- `mixes[].isMuted`: Mute for specific mix

**Example: Channel at 100% overall, but 50% in Stream Mix, 80% in Monitor Mix**

```json
{
  "id": 101,
  "jsonrpc": "2.0",
  "method": "setChannel",
  "params": {
    "id": "spotify",
    "level": 1.0,
    "mixes": [
      { "id": "stream_mix", "level": 0.5 },
      { "id": "monitor_mix", "level": 0.8 }
    ]
  }
}
```

---

## Error Handling

### Connection Errors

- If port 1884 is unavailable, try ports 1885-1893
- Use the origin header `streamdeck://` for compatibility
- Wave Link must be running for connection to succeed

### Common Error Codes

JSON-RPC 2.0 standard error codes:

- `-32700`: Parse error (invalid JSON)
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

---

## Implementation Notes

1. **Request IDs**: Should increment sequentially for easier tracking
2. **Throttling**: Some notifications are throttled (100ms for channel/input changes)
3. **Reconnection**: Implement automatic reconnection with exponential backoff
4. **State Management**: Cache the state from `get*` methods and update with notifications
5. **Level Meters**: Subscribe only when needed (generates high-frequency notifications)
6. **Focus Tracking**: `focusedAppChanged` is useful for auto-switching channel volumes

---

## Example Use Cases

### Simple Channel Mute Toggle

```javascript
// Get current state
const channelsResponse = await call("getChannels", null);
const channel = channelsResponse.result.channels.find((c) => c.id === "spotify");

// Toggle mute
await call("setChannel", {
  id: "spotify",
  isMuted: !channel.isMuted,
});
```

### Stream Mix vs Monitor Mix

Many users have two mixes:

- **Stream Mix**: What viewers hear (game loud, music quiet)
- **Monitor Mix**: What you hear (game quiet, music loud, comms loud)

```javascript
// Make music loud in headphones, quiet in stream
await call("setChannel", {
  id: "music",
  mixes: [
    { id: "stream_mix", level: 0.2 }, // 20% in stream
    { id: "monitor_mix", level: 0.8 }, // 80% in headphones
  ],
});
```

### Auto-Duck Music When Discord is Active

```javascript
// Subscribe to focused app
await call('setSubscription', {
  focusedAppChanged: { isEnabled: true }
});

// Listen for notifications
ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.method === 'focusedAppChanged') {
    const [appId, appName, channel] = msg.params;

    if (appId === 'com.discord.app') {
      // Duck music when Discord is active
      await call('setChannel', {
        id: 'music',
        mixes: [{ id: 'stream_mix', level: 0.3 }]
      });
    } else {
      // Restore music
      await call('setChannel', {
        id: 'music',
        mixes: [{ id: 'stream_mix', level: 0.7 }]
      });
    }
  }
});
```

---

## Protocol Version

This documentation is based on Wave Link 3.0 Beta. The `interfaceRevision` from `getApplicationInfo` indicates protocol compatibility.

**Compatibility:**

- `interfaceRevision >= 1`: This protocol is supported
