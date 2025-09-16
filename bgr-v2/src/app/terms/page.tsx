import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約',
  description: 'BGR - Board Game Reviewの利用規約'
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">利用規約</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第1条（適用）</h2>
          <p className="mb-4">
            この利用規約（以下「本規約」といいます。）は、BGR - Board Game Review（以下「本サービス」といいます。）が提供するサービスの利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第2条（利用登録）</h2>
          <p className="mb-4">
            本サービスにおいては、登録希望者が本規約に同意の上、本サービスの定める方法によって利用登録を申請し、本サービスがこれを承認することによって、利用登録が完了するものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
          <p className="mb-4">
            ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第4条（投稿コンテンツ）</h2>
          <p className="mb-4">
            ユーザーは、本サービスに投稿するコンテンツについて、以下の事項を遵守するものとします：
          </p>
          <ul className="list-disc ml-6 mb-4">
            <li>第三者の権利を侵害しない内容であること</li>
            <li>公序良俗に反しない内容であること</li>
            <li>事実と異なる情報を故意に流布しないこと</li>
            <li>商業目的での不適切な利用を行わないこと</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第5条（プライバシー）</h2>
          <p className="mb-4">
            本サービスは、ユーザーのプライバシー情報の取扱いについて、別途「プライバシーポリシー」において定めるものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第6条（免責事項）</h2>
          <p className="mb-4">
            本サービスは、本サービスに起因してユーザーに生じたあらゆる損害について、一切の責任を負いません。ただし、本サービスとユーザーとの間の契約が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第7条（サービス内容の変更等）</h2>
          <p className="mb-4">
            本サービスは、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第8条（利用規約の変更）</h2>
          <p className="mb-4">
            本サービスは必要に応じて、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">第9条（準拠法・裁判管轄）</h2>
          <p className="mb-4">
            本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、本サービスの本店所在地を管轄する裁判所を専属的合意管轄とします。
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