/**
 * Mixes Example - Controlling Mixes
 *
 * Demonstrates:
 * - Setting mix master volume
 * - Muting/unmuting mixes
 * - Toggling mix mute
 *
 * Run with: bun examples/mixes.ts
 */

import { WaveLinkClient } from "../src/index.js";

async function main() {
  const client = new WaveLinkClient();
  await client.connect();
  console.log("✓ Connected\n");

  const { mixes } = await client.getMixes();

  if (mixes.length === 0) {
    console.log("No mixes available");
    client.disconnect();
    return;
  }

  const mixId = mixes[0].id;
  console.log(`Using mix: ${mixes[0].name} (${mixId})\n`);

  // Set mix master volume
  console.log("Setting mix volume to 90%...");
  await client.setMixVolume(mixId, 0.9);
  await wait(500);

  console.log("Setting mix volume to 50%...");
  await client.setMixVolume(mixId, 0.5);
  await wait(500);

  console.log("Setting mix volume to 100%...");
  await client.setMixVolume(mixId, 1.0);
  await wait(500);

  // Mute/unmute mix
  console.log("Muting mix...");
  await client.setMixMute(mixId, true);
  await wait(1000);

  console.log("Unmuting mix...");
  await client.setMixMute(mixId, false);
  await wait(500);

  // Toggle mute
  console.log("Toggling mute...");
  await client.toggleMixMute(mixId);
  await wait(1000);
  await client.toggleMixMute(mixId);
  await wait(500);

  // Advanced: Set multiple properties at once
  console.log("\nSetting volume and mute together:");
  await client.setMix({
    id: mixId,
    level: 0.8,
    isMuted: false,
  });

  console.log("✓ Done");
  client.disconnect();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
