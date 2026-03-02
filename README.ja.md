# ClawGuard

> AIエージェント・セキュリティ・コンパニオン — 防御・監査・更新

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-372%20passing-brightgreen)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)]()

[English version](README.md)

## ClawGuardとは？

ClawGuardは、AIコーディングエージェントのためのリアルタイム・セキュリティレイヤーです。シェルコマンド・ファイル書き込み・ネットワークアクセスなどのツール呼び出しを実行前にインターセプトし、ポリシールールでリスクを評価して、100ms以内にallow（許可）/ confirm（確認）/ deny（拒否）の判定を返します。

Claude Code、Codex、MCPなど、フックベースのインターセプションに対応するあらゆるAIエージェントプラットフォームで動作します。コミュニティ知性ネットワーク（匿名化された判断データの集約）により、ユーザーが増えるほどリスク評価が賢くなります。

ClawGuardは「完全な防御」を約束しません。被害の確率を下げ、影響範囲を小さくし、すべてのAIエージェントセッションを監査・再現可能にします。

## クイックスタート

```bash
# インストール
npm install -g @clawguard-sec/cli

# 初期設定（AIエージェント用フックを自動構成）
claw-guard init

# 動作確認
claw-guard test
```

## しくみ

```
AIエージェントのツール呼び出し
    │
    ▼
┌─────────────┐
│  ClawGuard   │
│  フック層     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────┐
│  ポリシー     │────▶│  ルール   │  12コア + コミュニティ
│  エンジン     │     └──────────┘
└──────┬──────┘
       │
   ┌───┼───┐
   ▼   ▼   ▼
 許可  確認  拒否
       │
       ▼
  ExplainRisk
  （データに裏付けられた理由説明）
```

## アーキテクチャ

### 2層設計

**層1 — ランタイム防御**（フックベース、Docker不要）
- Adapter → Policy Engine → allow/confirm/deny
- confirm（確認）ダイアログにコミュニティの判断データを表示
- クロスエージェント判断記憶（SQLite）
- セキュリティパスポート（継続監視証明）

**層2 — インフラ隔離**（Docker、Pro/Max向け）
- 3コンテナ構成: gateway / fetcher / agent
- ネットワーク分離（agentは外部に直接通信不可）

## CLIコマンド

| コマンド | 説明 |
|---|---|
| `claw-guard init` | AIエージェント環境のセットアップ |
| `claw-guard evaluate --json` | ツールリクエストの評価（フックエントリポイント） |
| `claw-guard test` | ルール・エンジン・設定の検証 |
| `claw-guard serve` | HTTPフックサーバー（レイテンシ1-3ms） |
| `claw-guard log` | 監査ログの閲覧 |
| `claw-guard dashboard` | Webダッシュボードを起動 |
| `claw-guard feed` | 脅威フィードの管理（`--update`, `--status`） |
| `claw-guard marketplace` | ルールパックの管理（`installed`, `install`, `remove`） |
| `claw-guard upgrade` | ライセンス管理（`--key`, `--remove`） |
| `claw-guard passport` | セキュリティパスポート＆GitHubバッジ |
| `claw-guard replay` | インシデントリプレイ＆因果分析 |
| `claw-guard report` | 週次安全レポート |
| `claw-guard monitor` | 誤検知モニタリング |
| `claw-guard docker` | Dockerデプロイ（`init`, `up`, `down`） |
| `claw-guard skills` | Skills AVスキャン |

## 設定

最小構成 — `clawguard.yaml` に1行書くだけ:

```yaml
profile: balanced
```

### プリセット

| プリセット | 低リスク | 中リスク | 高リスク |
|---|---|---|---|
| `observer` | log | log | log |
| `guardian` | allow | confirm | deny |
| `balanced` | allow | confirm | confirm |
| `expert` | allow | allow | confirm |

### 優先順位

CLI引数 > プロジェクト（`.clawguard.yaml`） > グローバル（`~/.config/clawguard/`） > デフォルト（`balanced`）

## セキュリティルール

### コアルール（12件）

| ID | ツール | リスク | 説明 |
|---|---|---|---|
| `BASH.RM_RISK` | bash | high | `rm -rf` 再帰的強制削除 |
| `BASH.GIT_RESET_HARD` | bash | high | `git reset --hard` |
| `BASH.GIT_CLEAN_FDX` | bash | high | `git clean -fdx` |
| `BASH.GIT_PUSH_FORCE` | bash | high | `git push --force` |
| `BASH.CHMOD_777` | bash | medium | `chmod 777` 全権限付与 |
| `BASH.ROOT_PATH_OP` | bash | high | `/`（ルート）への操作 |
| `BASH.PIPE_EXEC_001` | bash | high | `curl \| bash` パイプ実行 |
| `BASH.PIPE_EXEC_002` | bash | high | `wget \| sh` パイプ実行 |
| `BASH.SSH_KEY_READ` | bash | medium | SSH鍵ファイルへのアクセス |
| `BASH.ENV_FILE_READ` | bash | medium | `.env`ファイルへのアクセス |
| `BASH.NPM_INSTALL` | bash | medium | `npm install <パッケージ>` |
| `BASH.PIP_INSTALL` | bash | medium | `pip install <パッケージ>` |

### ルール形式（YAML）

```yaml
- id: BASH.RM_RISK
  match:
    tool: bash
    command_regex: '(?:^|\s|;|&&|\|\|)rm\s+.*(-rf|-fr)\b'
  risk: high
  explain:
    title: "大量削除の可能性"
    what: "ファイルやフォルダをまとめて削除します。"
    why:
      - "削除対象を間違えると、プロジェクト全体が消えます。"
    check:
      - "削除対象のパスは本当に正しい？"
      - "バックアップ/コミットはある？"
    alternatives:
      - "先に `ls` で対象を確認する"
  meta:
    author: "clawguard"
    pack: "core"
    version: "1.0.0"
    tags: ["destructive"]
    phase: 0
```

## 料金プラン

| プラン | 価格 | 主な機能 |
|---|---|---|
| **Free** | $0 | 8コアルール、週次フィード、基本リプレイ（24時間） |
| **Pro** | $12/月 | 全ルール、日次フィード、パスポート、マーケットプレイス、Skills AV |
| **Max** | $39/月 | チーム管理、クロスチーム記憶、組織パスポート |

## プロジェクト構成

```
packages/
├── core/           ポリシーエンジン、ルールローダー、プリセット、型定義
├── cli/            CLIツール（claw-guardコマンド）
├── audit/          OCSF v1.1.0 監査ロガー
├── adapter-claude/ Claude Code PreToolUseフック
├── adapter-codex/  Codex承認ポリシー拡張
├── adapter-mcp/    MCP JSON-RPCプロキシ
├── billing/        ライセンスマネージャー、機能ゲート
├── feed/           署名付き日次フィードクライアント
├── enrichment/     npmレジストリ、CVE検索
├── memory/         SQLite判断ストア
├── reputation/     コミュニティ評判アグリゲーター
├── passport/       セキュリティパスポート＆バッジ生成
├── replay/         インシデントリプレイ＆因果分析
├── skills-av/      ハッシュマニフェスト、静的解析
├── team/           組織ポリシー＆メンバー管理
├── web-ui/         Reactダッシュボード
├── lp/             ランディングページ（英語＋日本語）
└── docker/         3コンテナ参考実装
rules/
├── core/           12コアルール（Phase 0-1）
└── phase2/         15追加ルール（Pro/Max向け）
```

## 開発

```bash
# 依存関係のインストール
npm install

# 全パッケージをビルド
npm run build

# テスト実行（372テスト）
npm test

# リント
npm run lint
```

## コントリビュート

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/my-feature`）
3. 変更に対するテストを記述
4. 全テストがパスすること（`npm test`）、lintがクリーンなこと（`npm run lint`）を確認
5. プルリクエストを送信

## ライセンス

MIT
