#!/usr/bin/env node
// EAS build post-install hook: patches react-native-reanimated's build.gradle
// to use lazy task matching instead of eager tasks.getByName(), which breaks on
// Gradle 8.14+ due to lazy task registration in AGP 8.x.
// Runs from mobile/ (eas-build-post-install CWD), checks both local and hoisted installs.
'use strict';
const fs = require('fs');
const path = require('path');

const candidates = [
  // EAS with npm install in mobile/ → packages in mobile/node_modules/
  path.resolve(__dirname, '..', 'node_modules', 'react-native-reanimated', 'android', 'build.gradle'),
  // EAS with workspace root npm install → packages hoisted to root node_modules/
  path.resolve(__dirname, '..', '..', 'node_modules', 'react-native-reanimated', 'android', 'build.gradle'),
];

const file = candidates.find(f => fs.existsSync(f));
if (!file) {
  console.log('[patch-reanimated-eas] build.gradle not found in any candidate path, skipping.');
  process.exit(0);
}

console.log('[patch-reanimated-eas] Found build.gradle at:', file);

let content = fs.readFileSync(file, 'utf8');

if (content.includes('PATCHED: use lazy matching')) {
  console.log('[patch-reanimated-eas] Already patched, skipping.');
  process.exit(0);
}

const NEEDLE =
`    afterEvaluate {
        tasks.getByName("externalNativeBuildDebug").dependsOn(findProject(":react-native-worklets").tasks.getByName("externalNativeBuildDebug"))
        tasks.getByName("externalNativeBuildRelease").dependsOn(findProject(":react-native-worklets").tasks.getByName("externalNativeBuildRelease"))
    }`;

const REPLACEMENT =
`    afterEvaluate {
        // PATCHED: use lazy matching instead of eager getByName (Gradle 8.14+ lazy task registration)
        def workletsProject = findProject(":react-native-worklets")
        if (workletsProject != null) {
            tasks.matching { it.name == "externalNativeBuildDebug" }.configureEach { t ->
                t.dependsOn(workletsProject.tasks.matching { it.name == "externalNativeBuildDebug" })
            }
            tasks.matching { it.name == "externalNativeBuildRelease" }.configureEach { t ->
                t.dependsOn(workletsProject.tasks.matching { it.name == "externalNativeBuildRelease" })
            }
        }
    }`;

if (content.includes(NEEDLE)) {
  fs.writeFileSync(file, content.replace(NEEDLE, REPLACEMENT), 'utf8');
  console.log('[patch-reanimated-eas] Patched build.gradle successfully.');
} else {
  console.warn('[patch-reanimated-eas] Expected block not found — reanimated version may differ. Patch skipped.');
}
