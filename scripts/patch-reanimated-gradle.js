#!/usr/bin/env node
// Patches react-native-reanimated's build.gradle to use lazy task matching
// instead of eager tasks.getByName(), which breaks on Gradle 8.14+ due to
// lazy task registration in AGP 8.x.
// Also invalidates the RNGP autolinking cache so stale paths are regenerated.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', 'react-native-reanimated', 'android', 'build.gradle');

if (!fs.existsSync(file)) {
  console.log('[patch-reanimated] build.gradle not found, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(file, 'utf8');

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
  console.log('[patch-reanimated] Patched build.gradle successfully.');
} else if (content.includes('PATCHED: use lazy matching')) {
  console.log('[patch-reanimated] Already patched, skipping.');
} else {
  console.warn('[patch-reanimated] Could not find expected block — patch skipped. Check reanimated version.');
}

// Invalidate RNGP autolinking cache SHA so Gradle regenerates autolinking.json
// with the correct react-native-worklets path on next build.
const shaFile = path.join(
  __dirname, '..', 'mobile', 'android', 'build', 'generated', 'autolinking', 'package.json.sha'
);
if (fs.existsSync(shaFile)) {
  fs.unlinkSync(shaFile);
  console.log('[patch-reanimated] Invalidated autolinking cache SHA.');
}
