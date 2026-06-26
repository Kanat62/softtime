#!/usr/bin/env node
// Patches @expo/cli's waitForMetroToObserveTypeScriptFile.js to handle the
// metro-file-map ≥0.84 API change: the 'change' event now emits
// { changes: { addedFiles, modifiedFiles, ... }, rootDir } instead of
// { eventsQueue: [...] }. Without this patch, the build crashes with
// "TypeError: eventsQueue is not iterable".
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src',
  'start', 'server', 'metro', 'waitForMetroToObserveTypeScriptFile.js'
);

if (!fs.existsSync(file)) {
  console.log('[patch-expo-metro-events] Target file not found, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(file, 'utf8');

if (content.includes('_toEventsQueue')) {
  console.log('[patch-expo-metro-events] Already patched, skipping.');
  process.exit(0);
}

const NEEDLE = `const debug = require('debug')('expo:start:server:metro:waitForTypescript');
function waitForMetroToObserveTypeScriptFile(projectRoot, runner, callback) {
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const tsconfigPath = _path().default.join(projectRoot, 'tsconfig.json');
    const listener = ({ eventsQueue })=>{
        for (const event of eventsQueue){`;

const REPLACEMENT = `const debug = require('debug')('expo:start:server:metro:waitForTypescript');
// Normalise metro-file-map >=0.84 ({ changes, rootDir }) -> legacy eventsQueue array
function _toEventsQueue(changeEvent) {
    if (changeEvent.eventsQueue) return changeEvent.eventsQueue;
    const { changes, rootDir = '' } = changeEvent;
    if (!changes) return [];
    const events = [];
    const join = _path().default.join;
    if (changes.addedDirectories) for (const p of changes.addedDirectories) events.push({ type: 'add', filePath: join(rootDir, p), metadata: { type: 'd' } });
    if (changes.addedFiles) for (const [p] of changes.addedFiles) events.push({ type: 'add', filePath: join(rootDir, p), metadata: { type: 'f' } });
    if (changes.modifiedFiles) for (const [p] of changes.modifiedFiles) events.push({ type: 'modify', filePath: join(rootDir, p), metadata: { type: 'f' } });
    if (changes.removedFiles) for (const [p] of changes.removedFiles) events.push({ type: 'delete', filePath: join(rootDir, p), metadata: { type: 'f' } });
    if (changes.removedDirectories) for (const p of changes.removedDirectories) events.push({ type: 'delete', filePath: join(rootDir, p), metadata: { type: 'd' } });
    return events;
}
function waitForMetroToObserveTypeScriptFile(projectRoot, runner, callback) {
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const tsconfigPath = _path().default.join(projectRoot, 'tsconfig.json');
    const listener = (changeEvent)=>{
        const eventsQueue = _toEventsQueue(changeEvent);
        for (const event of eventsQueue){`;

if (!content.includes(NEEDLE)) {
  console.warn('[patch-expo-metro-events] Could not find expected block — patch skipped. Check @expo/cli version.');
  process.exit(0);
}

content = content.replace(NEEDLE, REPLACEMENT);

// Fix observeFileChanges listener
content = content.replace(
  `    const listener = ({ eventsQueue })=>{
        for (const event of eventsQueue){`,
  `    const listener = (changeEvent)=>{
        const eventsQueue = _toEventsQueue(changeEvent);
        for (const event of eventsQueue){`
);

// Fix observeAnyFileChanges listener
content = content.replace(
  `    const listener = ({ eventsQueue })=>{
        callback(eventsQueue);
    };`,
  `    const listener = (changeEvent)=>{
        callback(_toEventsQueue(changeEvent));
    };`
);

fs.writeFileSync(file, content, 'utf8');
console.log('[patch-expo-metro-events] Patched waitForMetroToObserveTypeScriptFile.js successfully.');
