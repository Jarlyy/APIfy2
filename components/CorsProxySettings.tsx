'use client';

import { useState, useEffect } from 'react';
import { CORS_PROXIES, getCurrentProxy, setCurrentProxy } from '@/lib/cors-proxy';

export default function CorsProxySettings() {
  const [selectedProxy, setSelectedProxy] = useState(getCurrentProxy());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedProxy(getCurrentProxy());
  }, []);

  const handleProxyChange = (proxy: string) => {
    setSelectedProxy(proxy);
    setCurrentProxy(proxy);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
      >
        ⚙️ Настроить CORS прокси
      </button>
    );
  }

  return (
    <div className="rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Выбор CORS прокси сервиса
        </h4>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ✕ Закрыть
        </button>
      </div>
      
      <div className="space-y-2">
        {CORS_PROXIES.map((proxy) => (
          <label
            key={proxy.value}
            className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-750"
          >
            <input
              type="radio"
              name="corsProxy"
              value={proxy.value}
              checked={selectedProxy === proxy.value}
              onChange={(e) => handleProxyChange(e.target.value)}
              className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {proxy.name}
              </span>
              {proxy.value === 'local' && (
                <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Быстро и надёжно
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
      
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        💡 Локальный прокси работает через ваш Next.js сервер и не имеет ограничений
      </p>
    </div>
  );
}
