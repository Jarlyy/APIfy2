'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, CheckCircle, XCircle, Clock, Copy, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ExecutableTest {
  id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  auth_type: string;
  auth_token: string;
  expected_status: number;
  test_type: string;
  category: string;
  instructions?: string;
}

interface TestResult {
  id: string;
  status: 'success' | 'error' | 'running';
  response?: any;
  error?: string;
  duration?: number;
  actualStatus?: number;
}

interface ExecutableTestsPanelProps {
  tests: ExecutableTest[];
  onTestRun?: (testId: string, result: TestResult) => void;
  onTestsLoad?: (tests: ExecutableTest[]) => void;
}

export function ExecutableTestsPanel({ tests, onTestRun, onTestsLoad }: ExecutableTestsPanelProps) {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [editingTest, setEditingTest] = useState<string | null>(null);
  const [editedTests, setEditedTests] = useState<Record<string, ExecutableTest>>({});
  const [runningAll, setRunningAll] = useState(false);

  const runTest = async (test: ExecutableTest) => {
    const testToRun = editedTests[test.id] || test;
    
    setResults(prev => ({
      ...prev,
      [test.id]: { id: test.id, status: 'running' }
    }));

    const startTime = Date.now();

    try {
      // Подготавливаем заголовки
      const headers = { ...testToRun.headers };
      
      // Добавляем аутентификацию если нужно
      if (testToRun.auth_type === 'bearer' && testToRun.auth_token) {
        headers['Authorization'] = `Bearer ${testToRun.auth_token}`;
      } else if (testToRun.auth_type === 'api-key' && testToRun.auth_token) {
        headers['X-API-Key'] = testToRun.auth_token;
      }

      const requestOptions: RequestInit = {
        method: testToRun.method,
        headers,
        mode: 'cors', // Явно указываем режим CORS
      };

      if (testToRun.body && testToRun.method !== 'GET') {
        requestOptions.body = testToRun.body;
      }

      const response = await fetch(testToRun.url, requestOptions);
      const duration = Date.now() - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      try {
        // Клонируем ответ чтобы можно было прочитать его несколько раз
        const responseClone = response.clone();
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (parseError) {
        // Если не удалось распарсить как JSON, пробуем как текст
        try {
          responseData = await response.text();
        } catch (textError) {
          responseData = `Ошибка чтения ответа: ${parseError}`;
        }
      }

      const result: TestResult = {
        id: test.id,
        status: response.status === testToRun.expected_status ? 'success' : 'error',
        response: responseData,
        duration,
        actualStatus: response.status
      };

      setResults(prev => ({ ...prev, [test.id]: result }));
      onTestRun?.(test.id, result);

    } catch (error) {
      const duration = Date.now() - startTime;
      let errorMessage = 'Неизвестная ошибка';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Ошибка сети: Не удалось подключиться к серверу. Возможные причины:\n' +
                     '• CORS блокировка (сервер не разрешает запросы из браузера)\n' +
                     '• Неверный URL\n' +
                     '• Сервер недоступен\n' +
                     '• Блокировка браузером (HTTPS → HTTP)';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      const result: TestResult = {
        id: test.id,
        status: 'error',
        error: errorMessage,
        duration
      };

      setResults(prev => ({ ...prev, [test.id]: result }));
      onTestRun?.(test.id, result);
    }
  };

  const loadDemoTests = async () => {
    try {
      const response = await fetch('/demo-api-tests.json');
      const demoTests = await response.json();
      onTestsLoad?.(demoTests);
    } catch (error) {
      console.error('Ошибка загрузки демо-тестов:', error);
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    
    for (const test of tests) {
      await runTest(test);
      // Небольшая пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setRunningAll(false);
  };

  const copyTestAsCurl = (test: ExecutableTest) => {
    const testToUse = editedTests[test.id] || test;
    let curl = `curl -X ${testToUse.method}`;
    
    // Добавляем заголовки
    Object.entries(testToUse.headers).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`;
    });

    // Добавляем аутентификацию
    if (testToUse.auth_type === 'bearer' && testToUse.auth_token) {
      curl += ` -H "Authorization: Bearer ${testToUse.auth_token}"`;
    } else if (testToUse.auth_type === 'api-key' && testToUse.auth_token) {
      curl += ` -H "X-API-Key: ${testToUse.auth_token}"`;
    }

    // Добавляем тело запроса
    if (testToUse.body && testToUse.method !== 'GET') {
      curl += ` -d '${testToUse.body}'`;
    }

    curl += ` "${testToUse.url}"`;

    navigator.clipboard.writeText(curl);
  };

  const updateTest = (testId: string, field: string, value: string) => {
    setEditedTests(prev => ({
      ...prev,
      [testId]: {
        ...(prev[testId] || tests.find(t => t.id === testId)!),
        [field]: value
      }
    }));
  };

  const getStatusIcon = (result?: TestResult) => {
    if (!result) return null;
    
    switch (result.status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getCategoryColor = (category: string) => {    const colors = {
      auth: 'bg-blue-100 text-blue-800',
      data: 'bg-green-100 text-green-800',
      search: 'bg-purple-100 text-purple-800',
      crud: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">Нет готовых тестов для отображения</p>
          <Button onClick={loadDemoTests} variant="outline">
            🚀 Загрузить демо-тесты бесплатных API
          </Button>
          <p className="text-xs text-muted-foreground">
            15 готовых тестов популярных бесплатных API без регистрации
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Готовые тесты API</h3>
          <p className="text-sm text-muted-foreground">
            {tests.length} тестов готовых к запуску
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadDemoTests} variant="outline" size="sm">
            🚀 Демо-тесты
          </Button>
          <Button 
            onClick={runAllTests} 
            disabled={runningAll}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {runningAll ? 'Выполняется...' : 'Запустить все'}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Важно:</strong> Некоторые API могут блокировать запросы из браузера (CORS). 
          Если тест не работает, попробуйте использовать Postman или другой API клиент.
        </p>
      </div>

      <div className="grid gap-4">
        {tests.map((test) => {
          const result = results[test.id];
          const currentTest = editedTests[test.id] || test;
          const isEditing = editingTest === test.id;

          return (
            <Card key={test.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{test.name}</CardTitle>
                      {getStatusIcon(result)}
                      <Badge variant="outline" className={getCategoryColor(test.category)}>
                        {test.category}
                      </Badge>
                      <Badge variant="secondary">{test.test_type}</Badge>
                    </div>
                    <CardDescription>{test.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTest(isEditing ? null : test.id)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyTestAsCurl(test)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => runTest(test)}
                      disabled={result?.status === 'running'}
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Запустить
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList>
                      <TabsTrigger value="request">Запрос</TabsTrigger>
                      <TabsTrigger value="auth">Аутентификация</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="request" className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Метод</label>
                          <Input
                            value={currentTest.method}
                            onChange={(e) => updateTest(test.id, 'method', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Ожидаемый статус</label>
                          <Input
                            type="number"
                            value={currentTest.expected_status}
                            onChange={(e) => updateTest(test.id, 'expected_status', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">URL</label>
                        <Input
                          value={currentTest.url}
                          onChange={(e) => updateTest(test.id, 'url', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Заголовки (JSON)</label>
                        <Textarea
                          value={JSON.stringify(currentTest.headers, null, 2)}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value);
                              updateTest(test.id, 'headers', headers);
                            } catch {}
                          }}
                          rows={3}
                        />
                      </div>

                      {currentTest.method !== 'GET' && (
                        <div>
                          <label className="text-sm font-medium">Тело запроса</label>
                          <Textarea
                            value={currentTest.body}
                            onChange={(e) => updateTest(test.id, 'body', e.target.value)}
                            rows={3}
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="auth" className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Тип аутентификации</label>
                        <Input
                          value={currentTest.auth_type}
                          onChange={(e) => updateTest(test.id, 'auth_type', e.target.value)}
                          placeholder="none, bearer, api-key, basic"
                        />
                      </div>
                      
                      {currentTest.auth_type !== 'none' && (
                        <div>
                          <label className="text-sm font-medium">Токен/Ключ</label>
                          <Input
                            type="password"
                            value={currentTest.auth_token}
                            onChange={(e) => updateTest(test.id, 'auth_token', e.target.value)}
                            placeholder="Введите ваш токен или API ключ"
                          />
                        </div>
                      )}

                      {test.instructions && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">{test.instructions}</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{test.method}</Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{test.url}</code>
                    </div>
                    
                    {test.auth_type !== 'none' && (
                      <div className="text-sm text-muted-foreground">
                        🔐 Требует аутентификацию: {test.auth_type}
                      </div>
                    )}
                  </div>
                )}

                {result && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Результат:</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {result.duration && <span>{result.duration}ms</span>}
                        {result.actualStatus && (
                          <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                            {result.actualStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {result.error ? (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="text-sm text-red-800 whitespace-pre-line">{result.error}</div>
                        {result.error.includes('CORS') && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800">
                              💡 <strong>Совет:</strong> Для тестирования API с CORS ограничениями используйте:
                              <br />• Расширение браузера для отключения CORS
                              <br />• Postman или другие API клиенты
                              <br />• Прокси сервер
                            </p>
                          </div>
                        )}
                      </div>
                    ) : result.response && (
                      <div className="bg-muted rounded p-3 max-h-40 overflow-auto">
                        <pre className="text-xs">
                          {typeof result.response === 'string' 
                            ? result.response 
                            : JSON.stringify(result.response, null, 2)
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}