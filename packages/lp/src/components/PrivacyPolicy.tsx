import type { Lang } from "../types";
import { LegalPage } from "./LegalPage";

const TITLE = { en: "Privacy Policy", jp: "プライバシーポリシー" } as const;

export function PrivacyPolicy({ lang }: { lang: Lang }) {
	return (
		<LegalPage title={TITLE[lang]} lang={lang}>
			<p className="text-sm text-gray-500 mb-8">最終更新日: 2026年3月2日</p>

			<p className="mb-6">
				ClawGuard（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
				本プライバシーポリシーは、当サービスにおける情報の収集、利用、保護について説明します。
			</p>

			<Section title="1. 収集する情報">
				<p>当サービスでは、以下の情報を収集する場合があります。</p>
				<SubSection title="(a) アカウント情報">
					<p>
						有料プランの購入時に、メールアドレスおよび決済に必要な情報を収集します。決済処理はStripe,
						Inc.が行い、当サービスがクレジットカード番号を直接保持することはありません。
					</p>
				</SubSection>
				<SubSection title="(b) 利用データ">
					<p>
						Policy
						Engineによる判定ログ（ツール名、リスクレベル、判定結果）をローカル環境に保存します。このデータは原則としてユーザーの端末内に留まります。
					</p>
				</SubSection>
				<SubSection title="(c) 匿名利用統計">
					<p>
						サービス改善およびコミュニティ安全性向上のため、匿名化された判定統計データ（ルールごとの許可・拒否回数）を自動的に収集します。コマンドの内容、ユーザー名、メールアドレス等の個人情報は一切含まれません。送信を停止したい場合は、設定ファイルで無効化できます。
					</p>
				</SubSection>
			</Section>

			<Section title="2. 利用目的">
				<ul className="list-disc pl-6 space-y-2">
					<li>サービスの提供・運営・改善</li>
					<li>セキュリティルールの更新（脅威フィード配信）</li>
					<li>評判ネットワークによるコミュニティ安全性データの集約</li>
					<li>ユーザーサポートへの対応</li>
					<li>利用状況の分析によるサービス品質向上</li>
				</ul>
			</Section>

			<Section title="3. 第三者への提供">
				<p>当サービスは、以下の場合を除き、個人情報を第三者に提供しません。</p>
				<ul className="list-disc pl-6 space-y-2 mt-3">
					<li>ユーザーの同意がある場合</li>
					<li>法令に基づく場合</li>
					<li>決済処理のためStripe, Inc.に必要な情報を提供する場合</li>
				</ul>
			</Section>

			<Section title="4. データの安全管理">
				<ul className="list-disc pl-6 space-y-2">
					<li>監査ログはユーザーのローカル環境（SQLite）に保存され、サーバーには送信されません</li>
					<li>脅威フィードは暗号署名（cosign/Sigstore）で検証されます</li>
					<li>ライセンスキーはローカルの設定ファイルに保存されます</li>
					<li>通信はTLS（HTTPS）で暗号化されます</li>
				</ul>
			</Section>

			<Section title="5. Cookie">
				<p>
					当サービスのCLIツールはCookieを使用しません。ランディングページ（本サイト）では、
					分析目的でCookieまたは類似の技術を使用する場合があります。
				</p>
			</Section>

			<Section title="6. ユーザーの権利">
				<p>ユーザーは以下の権利を有します。</p>
				<ul className="list-disc pl-6 space-y-2 mt-3">
					<li>個人データの開示・訂正・削除の請求</li>
					<li>評判ネットワークへのデータ送信の停止（オプトアウト）</li>
					<li>アカウントの削除</li>
				</ul>
				<p className="mt-3">これらの請求は、下記のお問い合わせ先までご連絡ください。</p>
			</Section>

			<Section title="7. ポリシーの改定">
				<p>
					本ポリシーは、法令の変更やサービスの変更に伴い改定することがあります。
					重要な変更がある場合は、サービス上またはメールでお知らせします。
				</p>
			</Section>

			<Section title="8. お問い合わせ">
				<p>プライバシーに関するお問い合わせは、以下までご連絡ください。</p>
				<p className="mt-3">
					<a
						href="mailto:support@clawguard-sec.com"
						className="text-claw-500 hover:text-claw-400 transition-colors"
					>
						support@clawguard-sec.com
					</a>
				</p>
			</Section>
		</LegalPage>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-8">
			<h2 className="text-xl font-semibold text-gray-100 mb-4">{title}</h2>
			{children}
		</div>
	);
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mt-3 ml-2">
			<h3 className="text-base font-medium text-gray-200 mb-2">{title}</h3>
			{children}
		</div>
	);
}
