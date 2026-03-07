#!/usr/bin/env node
/**
 * bump-version.js
 * 指定したスクリプトのバージョンを上げてchangelogを記録する
 *
 * 使い方:
 *   node bump-version.js Example "バグ修正"
 *   node bump-version.js Example "新機能追加" --minor
 *   node bump-version.js Example "大幅リニューアル" --major
 *
 * オプション:
 *   なし    → パッチ更新 1.0.0 → 1.0.1
 *   --minor → マイナー更新 1.0.0 → 1.1.0
 *   --major → メジャー更新 1.0.0 → 2.0.0
 */

const fs   = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'registry.json');

function today() {
  return new Date().toISOString().split('T')[0];
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function main() {
  const args      = process.argv.slice(2);
  const id        = args[0];
  const changelog = args[1];
  const type      = args.includes('--major') ? 'major' : args.includes('--minor') ? 'minor' : 'patch';

  if (!id || !changelog) {
    console.log('使い方: node bump-version.js スクリプトID "変更内容"');
    console.log('例:     node bump-version.js Example "ボタンのバグ修正"');
    return;
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const script   = registry.scripts.find(s => s.id === id);

  if (!script) {
    console.log(`❌ "${id}" が見つかりません`);
    console.log('登録済みID:', registry.scripts.map(s => s.id).join(', '));
    return;
  }

  const oldVersion = script.version;
  const newVersion = bumpVersion(oldVersion, type);

  script.version   = newVersion;
  script.changelog = changelog;
  script.updated   = today();
  registry.updated = today();

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

  console.log(`✅ ${id}: v${oldVersion} → v${newVersion}`);
  console.log(`📝 changelog: ${changelog}`);
  console.log(`\n💡 GitHubにpushすればランチャーに「アップデート」ボタンが表示されます`);
}

main();
