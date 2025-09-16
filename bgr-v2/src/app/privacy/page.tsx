import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'BGR - Board Game Reviewのプライバシーポリシー'
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. 基本方針</h2>
          <p className="mb-4">
            BGR - Board Game Review（以下「当サイト」）は、お客様の個人情報保護の重要性について認識し、個人情報の保護に関する法律を遵守すると共に、適切な個人情報の保護に努めます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. 収集する情報</h2>
          <p className="mb-4">当サイトでは、以下の情報を収集する場合があります：</p>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>アカウント情報</strong>: OAuth認証（Google、Twitter/X）によって提供される基本的なプロフィール情報（ユーザー名、メールアドレス、プロフィール画像等）</li>
            <li><strong>コンテンツ</strong>: ユーザーが投稿するボードゲームのレビュー、評価、コメント等</li>
            <li><strong>利用データ</strong>: サービス利用状況、アクセス履歴、使用デバイス情報等</li>
            <li><strong>Cookieやその他の技術</strong>: ブラウザの設定、セッション管理、サービス改善のための匿名データ</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. 情報の利用目的</h2>
          <p className="mb-4">収集した情報は以下の目的で利用します：</p>
          <ul className="list-disc ml-6 mb-4">
            <li>アカウント管理および認証</li>
            <li>サービスの提供・運営・改善</li>
            <li>ユーザーサポートの提供</li>
            <li>コミュニティ機能の提供</li>
            <li>統計データの作成（個人を特定できない形で）</li>
            <li>セキュリティの確保および不正利用の防止</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. 第三者への情報提供</h2>
          <p className="mb-4">
            当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません：
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>サービス提供に必要な範囲で、信頼できる業務委託先に処理を委託する場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. 外部サービスとの連携</h2>
          <p className="mb-4">当サイトでは以下の外部サービスを利用しています：</p>
          <ul className="list-disc ml-6 mb-4">
            <li><strong>Supabase</strong>: データベースサービスおよび認証システム</li>
            <li><strong>Google OAuth</strong>: Googleアカウントによるログイン機能</li>
            <li><strong>Twitter/X OAuth</strong>: Twitter/Xアカウントによるログイン機能</li>
            <li><strong>BoardGameGeek API</strong>: ボードゲーム情報の取得</li>
            <li><strong>Netlify</strong>: ホスティングサービス</li>
          </ul>
          <p className="mb-4">
            これらのサービスには、それぞれ独自のプライバシーポリシーが適用されます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. データの保存期間</h2>
          <p className="mb-4">
            個人情報は、利用目的に必要な期間のみ保存し、目的を達成した後は適切に削除または匿名化します。ただし、法令により保存が義務付けられている場合はその限りではありません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. ユーザーの権利</h2>
          <p className="mb-4">ユーザーは以下の権利を有します：</p>
          <ul className="list-disc ml-6 mb-4">
            <li>個人情報の開示請求</li>
            <li>個人情報の訂正・削除請求</li>
            <li>利用停止請求</li>
            <li>アカウントの削除（退会）</li>
          </ul>
          <p className="mb-4">
            これらのご要望がある場合は、サイト内のお問い合わせフォームまたは設定画面からご連絡ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. セキュリティ</h2>
          <p className="mb-4">
            当サイトでは、個人情報の適切な管理のため、セキュリティシステムの維持、管理体制の徹底等、必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行います。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Cookie（クッキー）について</h2>
          <p className="mb-4">
            当サイトでは、より良いサービス提供のため、Cookieを使用する場合があります。Cookieの使用を望まない場合は、ブラウザからCookieを無効にすることができますが、その場合サービスの一部機能が制限される可能性があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. プライバシーポリシーの改定</h2>
          <p className="mb-4">
            当サイトでは、収集する情報の変更、利用目的の変更、またはその他プライバシーポリシーの変更を行う際は、当ページにて告知いたします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. お問い合わせ</h2>
          <p className="mb-4">
            当サイトの個人情報の取扱いに関するお問い合わせは、サイト内のお問い合わせフォームよりご連絡ください。
          </p>
        </section>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-600">
            制定日：2024年2月15日<br />
            最終改定日：2025年8月24日
          </p>
        </div>
      </div>
    </div>
  )
}