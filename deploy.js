#!/usr/bin/env node
/**
 * deploy.js
 * jsxbinをscripts/に置いてこれを実行するだけで全部完了
 *
 * やること:
 *   1. scripts/フォルダをスキャンして registry.json を自動更新
 *   2. GitHubに自動でpush（反映完了）
 *
 * 使い方:
 *   node deploy.js
 *   node deploy.js "コミットメッセージ"
 */

const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

// ── 設定（あなたのGitHubリポジトリURLに合わせて変更済み）──
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/47-CPU/egistry.json/main/scripts';
const SCRIPTS_DIR     = path.join(__dirname, 'scripts');
const REGISTRY_PATH   = path.join(__dirname, 'registry.json');
// ────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0];
}

function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return { version: '1.0.0', updated: today(), scripts: [] };
  }
}

function updateRegistry() {
  console.log('\n📦 registry.json を更新中...');

  if (!fs.existsSync(SCRIPTS_DIR)) {
    fs.mkdirSync(SCRIPTS_DIR);
    console.log('   scripts/ フォルダを作成しました');
  }

  const files    = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.jsxbin'));
  const registry = loadRegistry();

  if (files.length === 0) {
    console.log('   ⚠️  scripts/ フォルダに .jsxbin ファイルがありません');
    return false;
  }

  let added = 0;
  for (const file of files) {
    const id = file.replace('.jsxbin', '');
    if (registry.scripts.find(s => s.id === id)) continue;

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
    console.log(`   ✅ 追加: ${id}`);
    added++;
  }

  registry.updated = today();
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

  if (added === 0) {
    console.log('   新しいスクリプトはありませんでした（既存のみ）');
  }
  return true;
}

function gitPush(message) {
  console.log('\n🚀 GitHubにpush中...');
  try {
    // Gitが初期化されているか確認
    try {
      execSync('git status', { stdio: 'ignore' });
    } catch {
      console.log('   git init を実行します...');
      execSync('git init');
      execSync('git branch -M main');
    }

    execSync('git add registry.json scripts/', { stdio: 'inherit' });

    // 変更があるか確認
    const status = execSync('git status --porcelain').toString();
    if (!status.trim()) {
      console.log('   変更なし。pushをスキップしました。');
      return;
    }

    const msg = message || `update: ${today()}`;
    execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('\n✨ 完了！ランチャーに反映されました');
  } catch (err) {
    console.error('\n❌ push失敗:', err.message);
    console.log('\n💡 初回はGitHubとの接続設定が必要です。');
    console.log('   以下を順番に実行してください:');
    console.log('   git remote add origin https://github.com/47-CPU/egistry.json.git');
    console.log('   git push -u origin main');
  }
}

function main() {
  const message = process.argv[2];
  console.log('═══════════════════════════════');
  console.log('  AE Script Launcher - Deploy');
  console.log('═══════════════════════════════');

  updateRegistry();
  gitPush(message);
}

main();
