'use client'

import { useState, useEffect } from 'react'
import { AIProviderFactory } from '@/lib/ai-providers'

interface AIProviderSelectorProps {
  onProviderChange: (provider: 'gemini' | 'huggingface') => void
}

export default function AIProviderSelector({ onProviderChange }: AIProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'huggingface'>('gemini')
  const providers = AIProviderFactory.getAvailableProviders()

  useEffect(() => {
    // Определяем провайдер по умолчанию из переменных окружения или используем huggingface
    const defaultProvider = (process.env.NEXT_PUBLIC_DEFAULT_AI_PROVIDER as 'gemini' | 'huggingface') || 'huggingface'
    setSelectedProvider(defaultProvider)
  }, [])

  const handleProviderChange = (value: string) => {
    const provider = value as 'gemini' | 'huggingface'
    setSelectedProvider(provider)
    onProviderChange(provider)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        AI Модель:
      </span>
      <div className="relative">
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-[200px] h-9 px-3 pr-8 border border-input bg-background rounded-md text-sm appearance-none cursor-pointer"
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} - {provider.description}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}