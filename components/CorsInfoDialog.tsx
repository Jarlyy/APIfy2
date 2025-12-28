'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface CorsInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CorsInfoDialog({ isOpen, onClose }: CorsInfoDialogProps) {
  const corsFreendlyApis = [
    { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts', description: 'Тестовый REST API' },
    { name: 'HTTPBin', url: 'https://httpbin.org/get', description: 'HTTP тестирование' },
    { name: 'Dog API', url: 'https://dog.ceo/api/breeds/image/random', description: 'Случайные фото собак' },
    { name: 'REST Countries', url: 'https://restcountries.com/v3.1/all', description: 'Информация о странах' },
    { name: 'Cat Facts', url: 'https://catfact.ninja/fact', description: 'Факты о кошках' },
  ];

  const corsBlockedApis = [
    'GitHub API (некоторые endpoints)',
    'Twitter API',
    'Facebook API',
    'Instagram API',
    'Банковские API',
    'Корпоративные API'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Что такое CORS ошибка?
          </DialogTitle>
          <DialogDescription>
            CORS (Cross-Origin Resource Sharing) - механизм безопасности браузера
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Объяснение */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Почему возникает ошибка?</h3>
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="mb-2">
                <strong>1.</strong> Ваше приложение работает на <code>localhost:3000</code>
              </p>
              <p className="mb-2">
                <strong>2.</strong> API находится на другом домене (например, <code>api.github.com</code>)
              </p>
              <p>
                <strong>3.</strong> Браузер блокирует запрос, если API не разрешает доступ с вашего домена
              </p>
            </div>
          </div>

          {/* API которые работают */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              API которые работают из браузера
            </h3>
            <div className="space-y-2">
              {corsFreendlyApis.map((api) => (
                <div key={api.name} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{api.name}</div>
                    <div className="text-xs text-muted-foreground">{api.description}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(api.url);
                    }}
                    className="h-8"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* API которые блокируют */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              API которые часто блокируют CORS
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {corsBlockedApis.map((api) => (
                <Badge key={api} variant="destructive" className="justify-center text-xs py-1">
                  {api}
                </Badge>
              ))}
            </div>
          </div>

          {/* Решения */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Что делать?</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">1</Badge>
                <div>
                  <strong>Включите прокси</strong> - поставьте галочку "Использовать прокси (обход CORS)" в настройках тестов
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <strong>Используйте тестовые API</strong> из зеленого списка выше - они специально созданы для браузерного тестирования
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <strong>Используйте Postman или curl</strong> для тестирования API с CORS ограничениями
                </div>
              </div>
            </div>
          </div>

          {/* Техническая информация */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Техническая информация</h4>
            <p className="text-xs text-muted-foreground">
              CORS - это не ошибка APIfy, а стандартный механизм безопасности всех современных браузеров. 
              Он защищает пользователей от вредоносных сайтов, которые могут пытаться получить доступ к 
              чувствительным данным с других сайтов.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Понятно
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}