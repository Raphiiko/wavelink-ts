/**
 * Channels Example - Controlling Channels
 *
 * Demonstrates:
 * - Setting channel volume
 * - Muting/unmuting channels
 * - Setting per-mix volumes
 * - Setting per-mix mutes
 *
 * Run with: bun examples/channels.ts
 */

import { WaveLinkClient } from "../src/index.js";

async function main() {
  const client = new WaveLinkClient();
  await client.connect();
  console.log("✓ Connected\n");

  const { channels } = await client.getChannels();
  const { mixes } = await client.getMixes();

  if (channels.length === 0) {
    console.log("No channels available");
    client.disconnect();
    return;
  }

  const channelId = channels[0].id;
  console.log(`Using channel: ${channelId}\n`);

  // Set overall channel volume
  console.log("Setting channel volume to 75%...");
  await client.setChannelVolume(channelId, 0.75);
  await wait(500);

  console.log("Setting channel volume to 50%...");
  await client.setChannelVolume(channelId, 0.5);
  await wait(500);

  // Mute/unmute channel
  console.log("Muting channel...");
  await client.setChannelMute(channelId, true);
  await wait(1000);

  console.log("Unmuting channel...");
  await client.setChannelMute(channelId, false);
  await wait(500);

  // Toggle mute
  console.log("Toggling mute...");
  await client.toggleChannelMute(channelId);
  await wait(1000);
  await client.toggleChannelMute(channelId);
  await wait(500);

  if (mixes.length > 0) {
    const mixId = mixes[0].id;
    console.log(`\nPer-mix control (using ${mixId}):`);

    // Set volume for specific mix
    console.log("Setting volume to 30% in this mix...");
    await client.setChannelMixVolume(channelId, mixId, 0.3);
    await wait(500);

    console.log("Setting volume to 80% in this mix...");
    await client.setChannelMixVolume(channelId, mixId, 0.8);
    await wait(500);

    // Mute in specific mix
    console.log("Muting in this mix only...");
    await client.setChannelMixMute(channelId, mixId, true);
    await wait(1000);

    console.log("Unmuting in this mix...");
    await client.setChannelMixMute(channelId, mixId, false);
    await wait(500);
  }

  // Advanced: Set multiple properties at once
  if (mixes.length >= 2) {
    console.log("\nSetting different volumes for different mixes:");
    await client.setChannel({
      id: channelId,
      level: 1.0,
      mixes: [
        { id: mixes[0].id, level: 0.3 },
        { id: mixes[1].id, level: 0.7 },
      ],
    });
    await wait(1000);
  }

  // Restore defaults
  console.log("\nRestoring to defaults...");
  await client.setChannel({
    id: channelId,
    level: 1.0,
    isMuted: false,
  });

  console.log("✓ Done");
  client.disconnect();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
