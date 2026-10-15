#!/usr/bin/env node
/**
 * Проверка целостности словарей i18n. Запуск из корня: npm run check:i18n
 *
 * Что проверяет:
 *  1. Паритет ключей ru/en в каждом источнике словарей:
 *     web/src/shared/i18n/locales, mobile/src/shared/i18n/locales
 *     и packages/shared (namespace enums, validation, errors, push).
 *  2. Плейсхолдеры {{...}}: у одного ключа в ru и en один и тот же набор.
 *  3. Формы множественного числа: если ключ плюрализован, в ru обязаны быть
 *     one/few/many/other, в en — one/other (категории Intl.PluralRules).
 *  4. Статические ключи t('ns:key') из кода web и mobile существуют
 *     в словарях соответствующего клиента.
 *
 * Падает с кодом 1 и списком расхождений. Динамические ключи
 * (t(`ns:prefix.${x}`)) и ключи без namespace статически не проверяются —
 * их число печатается, чтобы граница проверки была видна.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
const notes = [];

// ─── Загрузка словарей ────────────────────────────────────────────────────────

/** JSON-словари клиента: locales/{ru,en}/<ns>.json → { ns: object }. */
function loadJsonLocales(dir, lang) {
  const base = path.join(ROOT, dir, lang);
  if (!fs.existsSync(base)) {
    problems.push(`нет каталога словарей: ${path.relative(ROOT, base)}`);
    return {};
  }
  const out = {};
  for (const f of fs.readdirSync(base).filter((f) => f.endsWith('.json'))) {
    out[path.basename(f, '.json')] = JSON.parse(fs.readFileSync(path.join(base, f), 'utf8'));
  }
  return out;
}

/** Общий словарь из packages/shared — собранный dist, как его видит backend. */
function loadShared() {
  const dist = path.join(ROOT, 'packages/shared/dist/index.js');
  if (!fs.existsSync(dist)) {
    problems.push(
      'packages/shared/dist отсутствует — соберите: npm run build --workspace=@softtime/shared',
    );
    return { ru: {}, en: {} };
  }
  const { ru, en } = require(dist);
  const pick = (d) => ({
    enums: d.enums,
    validation: d.validation,
    errors: d.errors,
    push: d.push,
  });
  return { ru: pick(ru), en: pick(en) };
}

/** Плоский список [ns:path, value] из { ns: {...} }. */
function flatten(nsMap) {
  const out = [];
  const walk = (node, prefix) => {
    for (const [k, v] of Object.entries(node ?? {})) {
      if (v === null || v === undefined) continue;
      if (typeof v === 'object') walk(v, `${prefix}${k}.`);
      else out.push([`${prefix}${k}`, String(v)]);
    }
  };
  for (const [ns, tree] of Object.entries(nsMap)) walk(tree, `${ns}:`);
  return out;
}

// ─── Проверки словарей ────────────────────────────────────────────────────────

const PLURAL_SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const REQUIRED_FORMS = { ru: ['one', 'few', 'many', 'other'], en: ['one', 'other'] };

const placeholders = (s) =>
  [...new Set((s.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []).map((m) => m.replace(/[{}\s]/g, '')))]
    .sort()
    .join(',');

/** 'home:stats.count_one' → { base: 'home:stats.count', form: 'one' } или null. */
function splitPlural(key) {
  const m = key.match(/^(.*)_([a-z]+)$/);
  if (!m || !PLURAL_SUFFIXES.includes(m[2])) return null;
  return { base: m[1], form: m[2] };
}

/**
 * Приводит словарь к виду, в котором языки сравнимы.
 *
 * Плюрализованные ключи НЕ сравниваются суффикс в суффикс: формы задаёт
 * язык, у ru их четыре (one/few/many/other), у en две (one/other). Поэтому
 * такие ключи сводятся к базе, а полнота форм внутри языка проверяется
 * отдельно. Для сравнения текста у базы берём форму `other` — она есть
 * в обоих языках.
 */
function normalize(label, lang, map) {
  const forms = new Map(); // base → Map(form → value)
  const plain = new Map(); // key  → value

  for (const [k, v] of map) {
    const p = splitPlural(k);
    if (p) {
      if (!forms.has(p.base)) forms.set(p.base, new Map());
      forms.get(p.base).set(p.form, v);
    } else {
      plain.set(k, v);
    }
  }

  // полнота форм внутри языка
  for (const [base, byForm] of forms) {
    const missing = REQUIRED_FORMS[lang].filter((f) => !byForm.has(f));
    if (missing.length)
      problems.push(
        `${label}/${lang}: у ${base} нет форм ${missing.join(', ')} (есть: ${[...byForm.keys()].sort().join(', ')})`,
      );
    // Лишние формы — не ошибка: селектор Intl.PluralRules их просто не
    // спросит (в push-словаре packages/shared все четыре формы заданы в обоих
    // языках намеренно, чтобы тип PluralPushMessage был симметричен).
    // Но печатаем, чтобы случайная копипаста из ru в en была видна.
    const extra = [...byForm.keys()].filter((f) => !REQUIRED_FORMS[lang].includes(f));
    if (extra.length)
      notes.push(`${label}/${lang}: у ${base} формы ${extra.join(', ')} этому языку не нужны (не ошибка)`);
  }

  // сравнимое представление: обычные ключи + базы плюралей по форме other
  const comparable = new Map(plain);
  for (const [base, byForm] of forms) {
    comparable.set(base, byForm.get('other') ?? [...byForm.values()][0]);
  }
  return { comparable, plural: new Set(forms.keys()) };
}

function checkSource(label, ruMap, enMap) {
  const ru = new Map(flatten(ruMap));
  const en = new Map(flatten(enMap));

  const nRu = normalize(label, 'ru', ru);
  const nEn = normalize(label, 'en', en);

  // 1. паритет ключей (плюрали — по базе)
  for (const k of nRu.comparable.keys())
    if (!nEn.comparable.has(k)) problems.push(`${label}: ключ есть в ru, нет в en — ${k}`);
  for (const k of nEn.comparable.keys())
    if (!nRu.comparable.has(k)) problems.push(`${label}: ключ есть в en, нет в ru — ${k}`);

  // 2. ключ плюрализован в одном языке и нет в другом
  for (const k of nRu.plural)
    if (nEn.comparable.has(k) && !nEn.plural.has(k))
      problems.push(`${label}: ${k} плюрализован в ru, но не в en`);
  for (const k of nEn.plural)
    if (nRu.comparable.has(k) && !nRu.plural.has(k))
      problems.push(`${label}: ${k} плюрализован в en, но не в ru`);

  // 3. пустые значения (по всем формам)
  for (const [lang, map] of [['ru', ru], ['en', en]])
    for (const [k, v] of map) if (!v.trim()) problems.push(`${label}/${lang}: пустое значение — ${k}`);

  // 4. плейсхолдеры совпадают
  for (const [k, v] of nRu.comparable) {
    if (!nEn.comparable.has(k)) continue;
    const a = placeholders(v);
    const b = placeholders(nEn.comparable.get(k));
    if (a !== b) problems.push(`${label}: разные плейсхолдеры у ${k} — ru[${a || '—'}] en[${b || '—'}]`);
  }

  return { ru, en, plain: new Set(nRu.comparable.keys()) };
}

// ─── Проверка ключей из кода ──────────────────────────────────────────────────

function sourceFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === 'locales') continue;
        walk(p);
      } else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
    }
  };
  walk(path.join(ROOT, dir));
  return out;
}

/** Статические t('ns:key') / i18n.t("ns:key") / i18n.exists('ns:key'). */
const STATIC_T = /\b(?:t|i18n\.t|i18n\.exists)\(\s*(['"`])([a-zA-Z][\w-]*:[\w.-]+?)\1/g;
/** Шаблонные — считаем, но не проверяем. */
const DYNAMIC_T = /\b(?:t|i18n\.t)\(\s*`[^`]*\$\{/g;

function checkCodeKeys(label, dir, known) {
  let dynamic = 0;
  const missing = new Map(); // key → Set(file:line)

  for (const file of sourceFiles(dir)) {
    const src = fs.readFileSync(file, 'utf8');
    dynamic += (src.match(DYNAMIC_T) || []).length;

    for (const m of src.matchAll(STATIC_T)) {
      const key = m[2];
      if (known.plain.has(key) || known.ru.has(key)) continue;
      const line = src.slice(0, m.index).split('\n').length;
      if (!missing.has(key)) missing.set(key, new Set());
      missing.get(key).add(`${path.relative(ROOT, file)}:${line}`);
    }
  }

  for (const [key, where] of missing)
    problems.push(`${label}: ключа нет в словарях — ${key}  (${[...where].join(', ')})`);

  notes.push(`${label}: шаблонных t(\`...\${}\`) пропущено ${dynamic} — проверяются только статические ключи`);
}

// ─── Прогон ───────────────────────────────────────────────────────────────────

const shared = loadShared();
const sharedRes = checkSource('packages/shared', shared.ru, shared.en);

const webRu = loadJsonLocales('web/src/shared/i18n/locales', 'ru');
const webEn = loadJsonLocales('web/src/shared/i18n/locales', 'en');
const webRes = checkSource('web', webRu, webEn);

const mobRu = loadJsonLocales('mobile/src/shared/i18n/locales', 'ru');
const mobEn = loadJsonLocales('mobile/src/shared/i18n/locales', 'en');
const mobRes = checkSource('mobile', mobRu, mobEn);

// Клиенту доступны и его JSON, и общий словарь — объединяем.
const merge = (a, b) => ({
  ru: new Map([...a.ru, ...b.ru]),
  plain: new Set([...a.plain, ...b.plain]),
});
checkCodeKeys('web', 'web/src', merge(webRes, sharedRes));
checkCodeKeys('mobile', 'mobile/src', merge(mobRes, sharedRes));

// ─── Вывод ────────────────────────────────────────────────────────────────────

const count = (r) => r.ru.size;
console.log('i18n: паритет словарей и ключи из кода\n');
console.log(`  packages/shared : ${count(sharedRes)} строк (enums, validation, errors, push)`);
console.log(`  web            : ${count(webRes)} строк в ${Object.keys(webRu).length} namespace`);
console.log(`  mobile         : ${count(mobRes)} строк в ${Object.keys(mobRu).length} namespace`);
console.log(`  всего          : ${count(sharedRes) + count(webRes) + count(mobRes)} строк × 2 языка\n`);
for (const n of notes) console.log(`  i  ${n}`);

if (problems.length) {
  console.error(`\n✗ расхождений: ${problems.length}\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('\n✓ паритет ru/en полный, плейсхолдеры и формы числа совпадают, все статические ключи найдены');
