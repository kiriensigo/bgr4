export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container relative mx-auto flex min-h-[10vh] items-center px-4 py-4 lg:py-6">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            簡単ボードゲームレビュー！
          </h1>
        </div>
        <div className="sr-only">
          <a href="/games">ゲーム一覧を見る</a>
        </div>
      </div>
    </section>
  )
}
