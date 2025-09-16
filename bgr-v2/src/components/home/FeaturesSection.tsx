'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Star, 
  BarChart3, 
  Users, 
  Target,
  Filter,
  BookOpen,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export function FeaturesSection() {
  const features = [
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: '詳細評価システム',
      description: '従来の星評価に加え、複雑さ、運要素、相互作用、ダウンタイムの4つの観点で詳細に評価',
      highlight: 'NEW',
      color: 'blue'
    },
    {
      icon: <Search className="w-8 h-8 text-green-600" />,
      title: '高度な検索機能',
      description: 'メカニクス、カテゴリー、プレイ人数、時間、評価など多様な条件で理想のゲームを発見',
      color: 'green'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: 'データ分析',
      description: 'ゲームの統計情報、トレンド分析、人気度ランキングなど豊富なデータを可視化',
      color: 'purple'
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: 'コミュニティ',
      description: 'レビューへのコメント、ディスカッション機能で他のプレイヤーと交流',
      color: 'orange'
    },
    {
      icon: <Filter className="w-8 h-8 text-red-600" />,
      title: 'ファセット検索',
      description: '検索結果から更に絞り込みができるインタラクティブなフィルター機能',
      highlight: 'BETA',
      color: 'red'
    },
    {
      icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
      title: 'BGG連携',
      description: 'BoardGameGeekからの豊富なゲーム情報を自動取得・同期',
      color: 'indigo'
    }
  ]

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">BGRの特徴</h2>
          <p className="text-lg text-muted-foreground">
            ボードゲーム愛好家のために設計された、次世代レビュープラットフォーム
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all duration-200 relative overflow-hidden group"
            >
              {/* Highlight Badge */}
              {feature.highlight && (
                <div className="absolute top-4 right-4">
                  <div className={`
                    px-2 py-1 text-xs font-bold rounded-full text-white
                    ${feature.highlight === 'NEW' ? 'bg-green-500' : 'bg-blue-500'}
                  `}>
                    {feature.highlight}
                  </div>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {feature.description}
                </p>

                {/* Feature-specific actions */}
                <div className="space-y-2">
                  {index === 0 && (
                    <Button variant="ghost" size="sm" asChild className="w-full justify-between">
                      <Link href="/reviews/new">
                        詳細評価を試す
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                  {index === 1 && (
                    <Button variant="ghost" size="sm" asChild className="w-full justify-between">
                      <Link href="/search">
                        高度な検索を試す
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                  {index === 2 && (
                    <Button variant="ghost" size="sm" asChild className="w-full justify-between">
                      <Link href="/search?sortBy=popularity&sortOrder=desc">
                        人気ランキングを見る
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                  {index === 3 && (
                    <Button variant="ghost" size="sm" asChild className="w-full justify-between">
                      <Link href="/reviews">
                        レビューを見る
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                  {index === 4 && (
                    <Button variant="ghost" size="sm" asChild className="w-full justify-between">
                      <Link href="/search">
                        ファセット検索を試す
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                  {index === 5 && (
                    <Button variant="ghost" size="sm" disabled className="w-full justify-between text-muted-foreground">
                      BGG連携機能
                      <span className="text-xs">実装予定</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">BGRでボードゲーム体験を共有しよう</h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                あなたのゲーム体験が、他のプレイヤーの新しい発見につながります。
                詳細な評価システムで、より具体的で役立つレビューを投稿してみませんか？
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-12 px-8" asChild>
                  <Link href="/reviews/new">
                    <Star className="w-5 h-5 mr-2" />
                    レビューを書く
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                  <Link href="/search">
                    <Search className="w-5 h-5 mr-2" />
                    ゲームを探す
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}