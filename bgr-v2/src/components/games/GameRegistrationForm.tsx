'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import BGGRegistrationForm from './BGGRegistrationForm'
import ManualRegistrationForm from './ManualRegistrationForm'

export default function GameRegistrationForm() {
  const [activeTab, setActiveTab] = useState('bgg')

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger 
            value="bgg" 
            className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            BGG連携登録
          </TabsTrigger>
          <TabsTrigger 
            value="manual"
            className="text-sm font-medium data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            手動登録
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bgg" className="space-y-6">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                BGG連携登録
              </CardTitle>
              <CardDescription className="text-blue-700">
                BoardGameGeek（BGG）のゲームデータを自動取得して登録します。
                BGG URLまたはゲームIDを入力してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BGGRegistrationForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-green-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                手動登録
              </CardTitle>
              <CardDescription className="text-green-700">
                BGGに登録されていないゲーム（主に日本語ゲーム）を手動で登録します。
                基本情報から順に入力してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManualRegistrationForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 登録方式の説明 */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <Card className={`transition-all duration-200 ${activeTab === 'bgg' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}>
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">BGG連携登録のメリット</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>豊富なデータが自動取得される</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>画像やカテゴリーが自動設定</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>BGG評価が基準スコアとして適用</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>入力の手間が大幅に削減</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`transition-all duration-200 ${activeTab === 'manual' ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'}`}>
          <CardHeader>
            <CardTitle className="text-lg text-green-900">手動登録が適している場合</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>日本語オリジナルゲーム</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>BGGに未登録のゲーム</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>同人・自主制作ゲーム</span>
            </div>
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>詳細な日本語情報を登録したい場合</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}