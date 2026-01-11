/**
 * Events Example - Listening for Changes
 *
 * Demonstrates:
 * - Connection events
 * - Channel change events
 * - Mix change events
 * - Input/output change events
 * - Focused app changes (with subscription)
 *
 * Run with: bun examples/events.ts
 * Then change something in Wave Link to see events fire
 */

import { WaveLinkClient } from "../src/index.js";

async function main() {
  const client = new WaveLinkClient();

  // Connection events
  client.on("connected", () => {
    console.log("✓ Connected to Wave Link");
  });

  client.on("disconnected", () => {
    console.log("✗ Disconnected from Wave Link");
  });

  client.on("error", (error) => {
    console.error("Error:", error.message);
  });

  // Channel events
  client.on("channelChanged", (channel) => {
    console.log("Channel changed:", {
      id: channel.id,
      muted: channel.isMuted,
      level: channel.level,
    });
  });

  client.on("channelsChanged", (result) => {
    console.log(`All channels updated (${result.channels.length} channels)`);
  });

  // Mix events
  client.on("mixChanged", (mix) => {
    console.log("Mix changed:", {
      id: mix.id,
      muted: mix.isMuted,
      level: mix.level,
    });
  });

  client.on("mixesChanged", (result) => {
    console.log(`All mixes updated (${result.mixes.length} mixes)`);
  });

  // Input/output events
  client.on("inputDeviceChanged", (device) => {
    console.log("Input device changed:", device);
  });

  client.on("outputDeviceChanged", (device) => {
    console.log("Output device changed:", device);
  });

  // Generic notification event (catches all notifications)
  client.on("notification", (method, params) => {
    console.log(`Notification: ${method}`, params);
  });

  await client.connect();

  // Subscribe to focused app changes
  console.log("\n✓ Subscribed to all events");
  console.log("Subscribing to focused app changes...\n");
  await client.subscribeFocusedApp(true);

  client.on("focusedAppChanged", ({ appId, appName, channel }) => {
    console.log("Focused app changed:", {
      app: appName,
      appId: appId,
      channel: channel.id,
    });
  });

  console.log("Listening for events...");
  console.log("Try changing volume, muting, or switching apps in Wave Link");
  console.log("Press Ctrl+C to exit\n");

  // Keep running
  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    client.disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
