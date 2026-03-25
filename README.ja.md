# ClawGuard

> AIエージェントの記憶 — 確認を減らして、判断を賢く

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-380%20passing-brightgreen)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)]()

[English version](README.md)

## ClawGuardとは？

AIエージェント、確認が多すぎませんか？ `npm install`のたびに確認、`git push`のたびに確認。5分前に「いいよ」って言ったのに、また同じことを聞いてくる。

ClawGuardが覚えておきます。一度OKした操作は記録して、次からは自動で通す。セッションをまたいでも、別のエージェントでも、別のツールでも。Claude Codeをはじめ、フック対応のエージェントならどれでも使えます。

危ない操作（`rm -rf`、`git push --force`、`curl|bash`）はもちろん止めます。でもインストールする本当の理由は、エージェントが静かに・速くなるから。

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
初回:       Agent → npm install foo → ClawGuard が確認 → 許可 → 記憶 ✓

2回目:      Agent → npm install foo → 自動許可（中断なし） ✓

危険な操作:  Agent → rm -rf / → 検知して理由を説明＋あなたの確認が必要 ✗
```

## 静かさレベルを選ぶ

どれくらい静かにするかは自分で決められます。全部見せるモードから、ほぼ無音まで:

| プリセット | スタイル | 低リスク | 中リスク | 高リスク |
|---|---|---|---|---|
| `observer` | 見るだけ | log | log | log |
| `guardian` | よく確認 | allow | confirm | deny |
| `balanced` | **おすすめ** | allow | confirm | confirm |
| `expert` | ほぼ無音 | allow | allow | confirm |

最小構成 — `clawguard.yaml` に1行書くだけ:

```yaml
profile: balanced
```

### 優先順位

CLI引数 > プロジェクト（`.clawguard.yaml`） > グローバル（`~/.config/clawguard/`） > デフォルト（`balanced`）

## アーキテクチャ

### 2層設計

**層1 — スマート承認**（フックベース、Docker不要）
- 一度OKした操作を覚えて、次から自動で通す（SQLite）
- 確認時に「他の開発者はどうしたか」をコミュニティデータで表示（準備中）
- Adapter → Policy Engine → allow/confirm/deny（100ms以内）
- セキュリティパスポート（継続監視の証明書）

**層2 — インフラ隔離**（Docker、オプション・参考実装）
- `claw-guard docker init` で docker-compose テンプレートを取得
- 3コンテナ構成: gateway / fetcher / agent
- ネットワーク分離（agentから外部へ直接通信できない）

## 組み込みの安全網

危険な操作は自動でキャッチします。設定は不要で、最初から12のルールが入っています。

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
| `BASH.SSH_KEY_READ` | bash | high | SSH鍵ファイルへのアクセス |
| `BASH.ENV_FILE_READ` | bash | medium | `.env`ファイルへのアクセス |
| `BASH.NPM_INSTALL` | bash | medium | `npm install <パッケージ>` |
| `BASH.PIP_INSTALL` | bash | medium | `pip install <パッケージ>` |

### いつ聞いてくる？

| 条件 | 動作 | 例 |
|---|---|---|
| 前にOKした操作 | **何も聞かず自動で通す** | `npm install express`（以前OKしたもの） |
| どのルールにもひっかからない | **何も聞かずそのまま実行** | `git status`, `ls`, `npm test` |
| ルールにひっかかる + confirm設定 | データ付きで確認を出す | `npm install unknown-pkg` |
| ルールにひっかかる + deny設定 | 理由を説明してブロック | `guardian`モードでの`rm -rf /` |

### 動かないケース

| 状況 | 理由 |
|---|---|
| AIエージェント自身がコマンドを断った | エージェントがツールを呼ばないので、ClawGuardの出番がない。これは多層防御（何重にも守る仕組み）として正常な動作です。 |
| `bypassPermissions` / `dontAsk` モードで実行中 | この権限モードではClawGuardの判定をスキップします。 |
| フックが入っていない | `claw-guard init` でフックを登録してください。 |

> **動作確認:** `claw-guard test` を実行するか、JSONを `claw-guard evaluate --json` にパイプすると、ルール照合を直接テストできます。

## CLIコマンド

| コマンド | 説明 |
|---|---|
| `claw-guard init` | AIエージェント環境のセットアップ |
| `claw-guard evaluate --json` | ツールリクエストの評価（フックエントリポイント） |
| `claw-guard test` | ルール・エンジン・設定の検証 |
| `claw-guard stats` | 自動許可カウント＆判断サマリーの表示 |
| `claw-guard serve` | HTTPフックサーバー（低レイテンシ） |
| `claw-guard log` | 監査ログの閲覧 |
| `claw-guard dashboard` | Webダッシュボードを起動 |
| `claw-guard feed` | 脅威フィードの管理（`--update`, `--status`） |
| `claw-guard marketplace` | ルールパックの管理（`installed`, `install`, `remove`） |
| `claw-guard passport` | セキュリティパスポート＆GitHubバッジ |
| `claw-guard replay` | インシデントリプレイ＆因果分析 |
| `claw-guard report` | 週次安全レポート |
| `claw-guard monitor` | 誤検知モニタリング |
| `claw-guard docker` | Dockerデプロイ（`init`, `up`, `down`） |
| `claw-guard skills` | Skills AVスキャン |
| `claw-guard team` | チーム管理（serve/add/list/remove/policy） |

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

## なぜClawGuard？

| | 手動hooks | mcp-scan | ClawGuard |
|---|---|---|---|
| エージェント間の記憶 | - | - | **あり** — 一度OKすれば、どこでも自動許可 |
| Claude Code / Codex / MCP対応 | - | MCPのみ | **3つとも対応** |
| コミュニティの知恵 | - | - | **あり** — 他の開発者の判断が見える |
| セットアップ | 自分で書く | インストール+スキャン | `claw-guard init`（1コマンド） |
| 料金 | 無料（自作） | 無料 | **無料（MIT、全機能）** |

ClawGuardはブロッカーではなく、便利ツールです。あなたの判断を覚えて確認回数を減らし、コミュニティの知恵を共有します。セキュリティは副産物であり、売りではありません。

## 料金

完全無料のオープンソース（MIT）。全機能が制限なく使えます。ライセンスキーも課金もありません。

## テレメトリ（匿名統計）

ClawGuardは匿名の利用統計を収集し、コミュニティの知恵として還元しています。確認ダイアログで「他の開発者の85%がこの操作を許可しています」のように表示されます。

### 送信するもの（6時間ごと）

- ルールIDごとの集計（許可/拒否/合計の件数のみ）

### 送信しないもの

- コマンド内容、ファイルパス、引数
- ユーザーの身元、IPアドレス、セッション情報
- プロジェクト名やリポジトリの情報

### 無効にするには

`clawguard.yaml` に以下を追加:

```yaml
reputation:
  opt_in: false
```

## プロジェクト構成

```
packages/
├── core/           ポリシーエンジン、ルールローダー、プリセット、型定義
├── cli/            CLIツール（claw-guardコマンド）
├── audit/          OCSF v1.1.0 監査ロガー
├── adapter-claude/ Claude Code PreToolUseフック
├── adapter-codex/  Codex承認ポリシー拡張
├── adapter-mcp/    MCP JSON-RPCプロキシ
├── billing/        機能設定（全機能が無制限で利用可能）
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
├── webhook/        Webhookハンドラー（Cloudflare Worker）
├── docker/         3コンテナ参考実装
├── api/            REST APIサーバー
├── sdk/            組み込み用SDK
└── siem/           SIEMコネクター
rules/
├── core/           12コアルール（Phase 0-1）
└── phase2/         15追加ルール
```

## 開発

```bash
# 依存関係のインストール
npm install

# 全パッケージをビルド
npm run build

# テスト実行（380テスト）
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
