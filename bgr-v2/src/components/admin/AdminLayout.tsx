'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2, 
  MessageSquare, 
  Settings, 
  Menu, 
  X,
  BarChart3,
  Shield,
  Home
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

const navigationItems = [
  {
    name: 'ダッシュボード',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'サイト統計とアクティビティ'
  },
  {
    name: 'ユーザー管理',
    href: '/admin/users',
    icon: Users,
    description: 'ユーザーアカウント管理'
  },
  {
    name: 'ゲーム管理',
    href: '/admin/games',
    icon: Gamepad2,
    description: 'ゲーム情報管理'
  },
  {
    name: 'レビュー管理',
    href: '/admin/reviews',
    icon: MessageSquare,
    description: 'レビューのモデレーション'
  },
  {
    name: 'システム設定',
    href: '/admin/settings',
    icon: Settings,
    description: 'サイト設定とメンテナンス'
  }
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} pathname={pathname} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-xl">
        <AdminSidebar pathname={pathname} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Logo for mobile */}
              <div className="flex items-center lg:hidden">
                <Gamepad2 className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold">BGR Admin</span>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">サイトに戻る</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function AdminSidebar({ onClose, pathname }: { onClose?: () => void; pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-red-600" />
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">BGR Admin</h1>
            <p className="text-xs text-gray-500">管理者パネル</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              {...(onClose && { onClick: onClose })}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                isActive ? "text-primary" : "text-gray-400"
              )} />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <BarChart3 className="h-4 w-4" />
          <span>管理者権限でログイン中</span>
        </div>
      </div>
    </div>
  )
}