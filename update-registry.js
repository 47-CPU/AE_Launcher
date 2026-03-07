#!/usr/bin/env node
/**
 * update-registry.js
 * scriptsフォルダのjsxbinを自動スキャンしてregistry.jsonを更新する
 *
 * 使い方:
 *   node update-registry.js
 *
 * scriptsフォルダに .jsxbin を置くだけで自動登録されます
 */

const fs   = require('fs');
const path = require('path');

// ── 設定 ──────────────────────────────────────
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/47-CPU/AE_Launcher/main/scripts';
const SCRIPTS_DIR     = path.join(__dirname, 'scripts');
const REGISTRY_PATH   = path.join(__dirname, 'registry.json');
// ──────────────────────────────────────────────

// 今日の日付を YYYY-MM-DD で返す
function today() {
  return new Date().toISOString().split('T')[0];
}

// 既存のregistry.jsonを読み込む（なければ空で初期化）
function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { version: '1.0.0', updated: today(), scripts: [] };
  }
}

// scriptsフォルダのjsxbinファイルを一覧取得
function getJsxbinFiles() {
  if (!fs.existsSync(SCRIPTS_DIR)) {
    fs.mkdirSync(SCRIPTS_DIR);
    console.log('📁 scripts/ フォルダを作成しました');
  }
  return fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.jsxbin'));
}

function main() {
  const registry = loadRegistry();
  const files    = getJsxbinFiles();

  if (files.length === 0) {
    console.log('⚠️  scripts/ フォルダに .jsxbin ファイルがありません');
    return;
  }

  let added   = 0;
  let skipped = 0;

  for (const file of files) {
    const id   = file.replace('.jsxbin', ''); // 例: Example.jsxbin → Example
    const existing = registry.scripts.find(s => s.id === id);

    if (existing) {
      // 既存エントリはスキップ（バージョンアップは手動）
      skipped++;
      continue;
    }

    // 新規追加
    registry.scripts.push({
      id,
      name:         id,
      description:  '',
      version:      '1.0.0',
      type:         'script',
      category:     'utility',
      free:         true,
      file_name:    file,
      download_url: `${GITHUB_RAW_BASE}/${file}`,
      changelog:    '初回リリース',
      updated:      today()
    });

    console.log(`✅ 追加: ${id}`);
    added++;
  }

  // 削除されたファイルを検出
  const removed = registry.scripts.filter(s => !files.includes(s.file_name));
  if (removed.length > 0) {
    console.log('\n⚠️  scriptsフォルダに存在しないエントリ:');
    removed.forEach(s => console.log(`   - ${s.id} (${s.file_name})`));
    console.log('   手動で削除するか、ファイルを戻してください\n');
  }

  // 更新日を今日に
  registry.updated = today();

  // 保存
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

  console.log(`\n📦 registry.json を更新しました`);
  console.log(`   追加: ${added} 件 / スキップ(既存): ${skipped} 件`);

  if (added > 0) {
    console.log('\n💡 次のステップ:');
    console.log('   1. registry.json の description を編集（任意）');
    console.log('   2. GitHubにpush → ランチャーに即反映');
  }
}

main();
