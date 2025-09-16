'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleDescriptionProps {
  title: string
  content: string
  maxLines?: number
}

export default function CollapsibleDescription({ 
  title, 
  content, 
  maxLines = 3 
}: CollapsibleDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-800 hover:text-blue-600 transition-colors"
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      
      {isExpanded ? (
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      ) : (
        <p 
          className={`text-gray-700 leading-relaxed line-clamp-${maxLines}`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {content}
        </p>
      )}
    </div>
  )
}