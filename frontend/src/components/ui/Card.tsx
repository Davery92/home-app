'use client'

import React from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gradient?: boolean
  hover?: boolean
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  gradient = false, 
  hover = false,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl shadow-lg transition-all duration-300 border border-white/20 dark:border-gray-700/50',
        gradient 
          ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' 
          : 'bg-white dark:bg-gray-800',
        hover && 'hover:shadow-xl hover:scale-[1.02]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card