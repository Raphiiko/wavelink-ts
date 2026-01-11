/**
 * Outputs Example - Controlling Output Devices
 *
 * Demonstrates:
 * - Setting output volume
 * - Switching output between mixes
 * - Removing output from all mixes
 *
 * Run with: bun examples/outputs.ts
 */

import { WaveLinkClient } from "../src/index.js";

async function main() {
  const client = new WaveLinkClient();

  await client.connect();
  console.log("✓ Connected\n");

  // Get available mixes and outputs
  const { mixes } = await client.getMixes();
  const { outputDevices } = await client.getOutputDevices();

  console.log("=== Available Mixes ===");
  mixes.forEach((mix) => {
    console.log(`${mix.name} (${mix.id})`);
  });
  console.log();

  console.log("=== Available Outputs ===");
  outputDevices.forEach((device) => {
    console.log(`${device.id}:`);
    device.outputs.forEach((output) => {
      console.log(`  Output ${output.id}:`);
      console.log(`    Volume: ${(output.level * 100).toFixed(0)}%`);
      console.log(`    Current Mix: ${output.mixId || "(none)"}`);
    });
  });
  console.log();

  // Example: Work with the first output device
  const firstDevice = outputDevices[0];
  const firstOutput = firstDevice?.outputs[0];

  if (!firstDevice || !firstOutput) {
    console.log("No output devices found");
    client.disconnect();
    return;
  }

  console.log(`Working with: ${firstDevice.id} / ${firstOutput.id}\n`);

  // 1. Set output volume
  console.log("=== Setting Output Volume ===");
  await client.setOutputVolume(firstDevice.id, firstOutput.id, 0.75);
  console.log("✓ Set volume to 75%\n");

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 2. Switch to a mix (if available)
  if (mixes.length > 0) {
    console.log("=== Switching Output to Mix ===");
    await client.switchOutputMix(
      firstDevice.id,
      firstOutput.id,
      mixes[0].id,
    );
    console.log(`✓ Switched to mix: ${mixes[0].name}\n`);

    // Verify
    const result1 = await client.getOutputDevices();
    const updated1 = result1.outputDevices
      .find((d) => d.id === firstDevice.id)
      ?.outputs.find((o) => o.id === firstOutput.id);
    console.log(`  Current mix: ${updated1?.mixId}\n`);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 3. Remove output from all mixes
  console.log("=== Removing Output from All Mixes ===");
  await client.removeOutputFromMix(firstDevice.id, firstOutput.id);
  console.log("✓ Removed from all mixes\n");

  // Verify
  const result2 = await client.getOutputDevices();
  const updated2 = result2.outputDevices
    .find((d) => d.id === firstDevice.id)
    ?.outputs.find((o) => o.id === firstOutput.id);
  console.log(`  Current mix: ${updated2?.mixId || "(none)"}\n`);

  // 4. Restore original state
  if (firstOutput.mixId) {
    console.log("=== Restoring Original Mix ===");
    await client.switchOutputMix(
      firstDevice.id,
      firstOutput.id,
      firstOutput.mixId,
    );
    console.log(`✓ Restored to: ${firstOutput.mixId}\n`);
  }

  // Restore original volume
  await client.setOutputVolume(firstDevice.id, firstOutput.id, firstOutput.level);
  console.log("✓ Restored original volume\n");

  client.disconnect();
}

main().catch(console.error);
