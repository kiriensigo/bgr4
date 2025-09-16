import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const allItems = [
    { name: 'ホーム', url: 'https://bgrq.netlify.app' },
    ...items
  ]

  return (
    <>
      <BreadcrumbStructuredData items={allItems} />
      <nav className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`} aria-label="パンくずリスト">
        <Link 
          href="/" 
          className="flex items-center hover:text-blue-600 transition-colors"
          aria-label="ホームページに戻る"
        >
          <Home className="w-4 h-4" />
          <span className="sr-only">ホーム</span>
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-1 text-gray-400" aria-hidden="true" />
            {index === items.length - 1 ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link 
                href={item.url.replace('https://bgrq.netlify.app', '')}
                className="hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  )
}