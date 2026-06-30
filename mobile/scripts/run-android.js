#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync, spawnSync, spawn } = require('child_process');

// Resolve Android SDK — mirrors Expo CLI's AndroidSdk.js logic, but also
// handles machines where ANDROID_HOME isn't set as a system env var.
function resolveAndroidSdk() {
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }
  if (process.env.ANDROID_SDK_ROOT && fs.existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }
  const defaults = {
    win32:  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
    darwin: path.join(process.env.HOME || '', 'Library', 'Android', 'sdk'),
    linux:  path.join(process.env.HOME || '', 'Android', 'sdk'),
  };
  const p = defaults[process.platform] || '';
  return (p && fs.existsSync(p)) ? p : '';
}

const sdkRoot = resolveAndroidSdk();
if (!sdkRoot) {
  console.error('[run-android] Cannot locate Android SDK. Set ANDROID_HOME and retry.');
  process.exit(1);
}

// Expose ANDROID_HOME so Expo CLI's whichEmulator() builds the full path
// instead of falling back to bare "emulator" (which isn't in PATH).
process.env.ANDROID_HOME = sdkRoot;

const isWin = process.platform === 'win32';
const platformTools = path.join(sdkRoot, 'platform-tools');
const emulatorDir   = path.join(sdkRoot, 'emulator');
const sep = isWin ? ';' : ':';
process.env.PATH = `${platformTools}${sep}${emulatorDir}${sep}${process.env.PATH || ''}`;

const adb = path.join(platformTools, isWin ? 'adb.exe' : 'adb');

// Restart ADB server. A stale or absent server causes getAttachedDevicesAsync()
// to return empty, which makes Expo fall back to startDeviceAsync() — the call
// that tries to launch the "emulator" binary and fails with ENOENT.
console.log('[run-android] Restarting ADB server...');
try {
  execSync(`"${adb}" kill-server`, { stdio: 'pipe' });
  execSync(`"${adb}" start-server`, { stdio: 'pipe' });
  console.log('[run-android] ADB server ready.');
} catch (e) {
  console.warn('[run-android] ADB restart failed (continuing):', e.message);
}

// Print attached devices so the user sees what Expo will pick.
try {
  const out = execSync(`"${adb}" devices -l`, { encoding: 'utf8' });
  console.log('[run-android] Devices:\n' + out.trim());
  const lines = out.trim().split('\n').slice(1).filter(Boolean);
  const physical = lines.filter(l => !l.includes('emulator') && l.includes('device'));
  if (!physical.length) {
    console.error(
      '[run-android] No physical device detected.\n' +
      '  Make sure USB debugging is enabled and the cable is connected.\n' +
      '  Accept the "Allow USB debugging" prompt on the phone if it appears.'
    );
    process.exit(1);
  }
} catch (e) {
  console.warn('[run-android] Could not query devices:', e.message);
}

// Launch expo run:android with the patched environment.
console.log('[run-android] Starting expo run:android...\n');
const child = spawn('npx', ['expo', 'run:android'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
