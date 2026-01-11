/**
 * Basic Example - Connection and Getting State
 *
 * Demonstrates:
 * - Connecting to Wave Link
 * - Getting application info
 * - Listing all channels, mixes, inputs, and outputs
 *
 * Run with: bun examples/basic.ts
 */

import { WaveLinkClient } from "../src/index.js";

async function main() {
  const client = new WaveLinkClient();

  // Connect (automatically tries ports 1884-1893)
  await client.connect();
  console.log("✓ Connected\n");

  // Get application info
  const info = await client.getApplicationInfo();
  console.log("=== Application Info ===");
  console.log(`Name: ${info.name}`);
  console.log(`App ID: ${info.appID}`);
  console.log(`Interface Revision: ${info.interfaceRevision}\n`);

  // Get all channels
  const { channels } = await client.getChannels();
  console.log("=== Channels ===");
  channels.forEach((ch) => {
    console.log(`${ch.id}:`);
    console.log(`  Type: ${ch.type}`);
    console.log(`  Volume: ${(ch.level * 100).toFixed(0)}%`);
    console.log(`  Muted: ${ch.isMuted}`);
    console.log(`  Mixes:`);
    ch.mixes.forEach((mix) => {
      console.log(
        `    ${mix.id}: ${(mix.level * 100).toFixed(0)}% (muted: ${mix.isMuted})`,
      );
    });
  });
  console.log();

  // Get all mixes
  const { mixes } = await client.getMixes();
  console.log("=== Mixes ===");
  mixes.forEach((mix) => {
    console.log(`${mix.name} (${mix.id}):`);
    console.log(`  Volume: ${(mix.level * 100).toFixed(0)}%`);
    console.log(`  Muted: ${mix.isMuted}`);
  });
  console.log();

  // Get input devices
  const { inputDevices } = await client.getInputDevices();
  console.log("=== Input Devices ===");
  inputDevices.forEach((device) => {
    console.log(`${device.id}:`);
    console.log(`  Is Wave Device: ${device.isWaveDevice}`);
    device.inputs.forEach((input) => {
      console.log(`  Input ${input.id}:`);
      console.log(`    Gain: ${(input.gain.value * 100).toFixed(0)}%`);
      console.log(`    Muted: ${input.isMuted}`);
    });
  });
  console.log();

  // Get output devices
  const { mainOutput, outputDevices } = await client.getOutputDevices();
  console.log("=== Output Devices ===");
  console.log(`Main Output: ${mainOutput}`);
  outputDevices.forEach((device) => {
    console.log(`${device.id}:`);
    device.outputs.forEach((output) => {
      console.log(`  Output ${output.id}:`);
      console.log(`    Volume: ${(output.level * 100).toFixed(0)}%`);
      console.log(`    Muted: ${output.isMuted}`);
      console.log(`    Mix: ${output.mixId}`);
    });
  });

  client.disconnect();
}

main().catch(console.error);
