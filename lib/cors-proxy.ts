// Утилита для обхода CORS блокировки через собственный прокси

export interface CorsProxyConfig {
  enabled: boolean;
  proxyUrl: string;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
}

// Типы прокси
export const PROXY_TYPES = {
  LOCAL: 'local', // Наш собственный Next.js прокси
  EXTERNAL: 'external', // Внешние публичные прокси (не рекомендуется)
} as const;

// Список доступных CORS прокси сервисов
export const CORS_PROXIES = [
  { name: 'Локальный прокси (рекомендуется)', value: 'local', type: PROXY_TYPES.LOCAL },
  { name: 'corsproxy.io', value: 'https://corsproxy.io/?', type: PROXY_TYPES.EXTERNAL },
  { name: 'allorigins.win', value: 'https://api.allorigins.win/raw?url=', type: PROXY_TYPES.EXTERNAL },
] as const;

// Получаем текущий прокси из localStorage или используем локальный по умолчанию
export function getCurrentProxy(): string {
  if (typeof window === 'undefined') return 'local';
  return localStorage.getItem('corsProxyUrl') || 'local';
}

// Сохраняем выбранный прокси
export function setCurrentProxy(proxyUrl: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('corsProxyUrl', proxyUrl);
}

// Получаем состояние CORS bypass из localStorage
export function getCorsProxyEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('corsProxyEnabled') === 'true';
}

// Сохраняем состояние CORS bypass
export function setCorsProxyEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('corsProxyEnabled', enabled ? 'true' : 'false');
}

// Выполняем запрос через прокси
export async function fetchThroughProxy(
  url: string,
  options: RequestInit = {}
): Promise<ProxyResponse> {
  const proxyType = getCurrentProxy();

  if (proxyType === 'local') {
    // Используем наш локальный Next.js прокси
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
    });

    const result = await response.json();
    
    if (!response.ok && result.error) {
      throw new Error(result.error);
    }

    return result;
  } else {
    // Используем внешний прокси (старый метод, может не работать)
    let finalUrl = url;
    
    if (proxyType.includes('allorigins')) {
      finalUrl = proxyType + encodeURIComponent(url);
    } else {
      finalUrl = proxyType + url;
    }

    const response = await fetch(finalUrl, options);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }
}

// Применяем прокси к URL если включен обход CORS (устаревший метод)
// Теперь рекомендуется использовать fetchThroughProxy
export function applyProxy(url: string, config: CorsProxyConfig): string {
  if (!config.enabled || !url) return url;
  
  // Для локального прокси возвращаем специальный URL
  if (config.proxyUrl === 'local') {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }
  
  // Для внешних прокси
  const encodedUrl = encodeURIComponent(url);
  
  if (config.proxyUrl.includes('allorigins')) {
    return config.proxyUrl + encodedUrl;
  }
  
  return config.proxyUrl + url;
}
