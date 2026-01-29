'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Brain, Play, CheckCircle, XCircle, Clock, 
  Settings, Eye, EyeOff, Zap
} from 'lucide-react';
import CorsProxySettings from './CorsProxySettings';
import AiAnalysis from './AiAnalysis';
import { applyProxy, getCurrentProxy, getCorsProxyEnabled, setCorsProxyEnabled } from '@/lib/cors-proxy';
import { isAiAnalysisEnabled, setAiAnalysisEnabled } from '@/lib/ai-analysis';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type AuthType = 'none' | 'bearer' | 'api-key' | 'basic';

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

interface UnifiedApiTesterProps {
  userId: string;
}

export function UnifiedApiTester({ userId }: UnifiedApiTesterProps) {
  // AI Generation State
  const [testServiceName, setTestServiceName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-tests');

  // Generated Tests State
  const [generatedTests, setGeneratedTests] = useState<ExecutableTest[]>([]);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  // Manual Test State
  const [manualTest, setManualTest] = useState({
    serviceName: '',
    url: '',
    method: 'GET' as HttpMethod,
    headers: '{}',
    body: '',
    authType: 'none' as AuthType,
    bearerToken: '',
    apiKey: '',
    apiKeyHeader: 'X-API-Key',
    basicUsername: '',
    basicPassword: ''
  });
  const [manualResult, setManualResult] = useState<any>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [corsProxyEnabled, setCorsProxyEnabledState] = useState(getCorsProxyEnabled());
  const [aiAnalysisEnabled, setAiAnalysisEnabledState] = useState(isAiAnalysisEnabled());

  // AI Generation Functions
  const generateExecutableTests = async () => {
    if (!testServiceName.trim()) return;

    setAiLoading(true);
    try {
      console.log('Отправляю запрос на генерацию тестов...');
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateExecutableTests',
          data: { serviceName: testServiceName.trim() }
        })
      });

      console.log('Ответ получен:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка ответа:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Данные получены:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      try {
        let testsData;
        if (typeof data.result === 'object') {
          testsData = data.result;
        } else {
          const jsonMatch = data.result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            testsData = JSON.parse(jsonMatch[0]);
          } else {
            testsData = JSON.parse(data.result);
          }
        }

        console.log('Распарсенные тесты:', testsData);

        if (Array.isArray(testsData)) {
          setGeneratedTests(testsData);
          console.log('Тесты установлены:', testsData.length);
        } else {
          throw new Error('Ответ не является массивом тестов');
        }
      } catch (e) {
        console.error('Ошибка парсинга тестов:', e);
        alert('Не удалось распарсить тесты от AI. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка генерации исполняемых тестов:', error);
      alert(`Ошибка при генерации тестов: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const loadDemoTests = async () => {
    try {
      const response = await fetch('/demo-api-tests.json');
      const demoTests = await response.json();
      setGeneratedTests(demoTests);
    } catch (error) {
      console.error('Ошибка загрузки демо-тестов:', error);
    }
  };

  // Test Execution Functions
  const runTest = async (test: ExecutableTest) => {
    setResults(prev => ({
      ...prev,
      [test.id]: { id: test.id, status: 'running' }
    }));

    const startTime = Date.now();

    try {
      const headers = { ...test.headers };
      
      if (test.auth_type === 'bearer' && test.auth_token) {
        headers['Authorization'] = `Bearer ${test.auth_token}`;
      } else if (test.auth_type === 'api-key' && test.auth_token) {
        headers['X-API-Key'] = test.auth_token;
      }

      const requestOptions: RequestInit = {
        method: test.method,
        headers,
        mode: 'cors',
      };

      if (test.body && test.method !== 'GET') {
        requestOptions.body = test.body;
      }

      // Применяем CORS прокси если включен
      let response;
      if (corsProxyEnabled) {
        const proxyType = getCurrentProxy();
        
        if (proxyType === 'local') {
          // Используем локальный прокси
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(test.url)}`;
          const proxyResponse = await fetch(proxyUrl, requestOptions);
          
          let proxyResult;
          try {
            proxyResult = await proxyResponse.json();
          } catch (parseError) {
            throw new Error(`Ошибка парсинга ответа прокси: ${parseError}`);
          }
          
          if (!proxyResponse.ok && proxyResult.error) {
            throw new Error(proxyResult.error);
          }

          const duration = Date.now() - startTime;
          
          const result: TestResult = {
            id: test.id,
            status: proxyResult.status === test.expected_status ? 'success' : 'error',
            response: proxyResult.data,
            duration,
            actualStatus: proxyResult.status
          };

          setResults(prev => ({ ...prev, [test.id]: result }));
          return;
        }
      }

      // Обычный запрос без прокси
      response = await fetch(test.url, requestOptions);
      const duration = Date.now() - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (parseError) {
        try {
          responseData = await response.text();
        } catch (textError) {
          responseData = `Ошибка чтения ответа: ${parseError}`;
        }
      }

      const result: TestResult = {
        id: test.id,
        status: response.status === test.expected_status ? 'success' : 'error',
        response: responseData,
        duration,
        actualStatus: response.status
      };

      setResults(prev => ({ ...prev, [test.id]: result }));

    } catch (error) {
      const duration = Date.now() - startTime;
      let errorMessage = 'Неизвестная ошибка';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Ошибка сети: CORS блокировка или сервер недоступен';
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
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    for (const test of generatedTests) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setRunningAll(false);
  };

  // Manual Test Functions
  const runManualTest = async () => {
    setManualLoading(true);
    setManualResult(null);

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(manualTest.headers);
      } catch (e) {
        throw new Error('Неверный формат заголовков JSON');
      }

      // Добавляем аутентификацию
      if (manualTest.authType === 'bearer' && manualTest.bearerToken) {
        parsedHeaders = { ...parsedHeaders, Authorization: `Bearer ${manualTest.bearerToken}` };
      } else if (manualTest.authType === 'api-key' && manualTest.apiKey) {
        parsedHeaders = { ...parsedHeaders, [manualTest.apiKeyHeader]: manualTest.apiKey };
      } else if (manualTest.authType === 'basic' && manualTest.basicUsername && manualTest.basicPassword) {
        const credentials = btoa(`${manualTest.basicUsername}:${manualTest.basicPassword}`);
        parsedHeaders = { ...parsedHeaders, Authorization: `Basic ${credentials}` };
      }

      const startTime = Date.now();
      
      // Применяем CORS прокси если включен
      if (corsProxyEnabled) {
        const proxyType = getCurrentProxy();
        
        if (proxyType === 'local') {
          // Используем локальный прокси
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(manualTest.url)}`;
          const proxyResponse = await fetch(proxyUrl, {
            method: manualTest.method,
            headers: parsedHeaders,
            body: manualTest.method !== 'GET' && manualTest.body ? manualTest.body : undefined,
          });

          let proxyResult;
          try {
            proxyResult = await proxyResponse.json();
          } catch (parseError) {
            throw new Error(`Ошибка парсинга ответа прокси: ${parseError}`);
          }
          
          if (!proxyResponse.ok && proxyResult.error) {
            throw new Error(proxyResult.error);
          }

          const responseTime = Date.now() - startTime;

          const result = {
            status: proxyResult.status,
            statusText: proxyResult.statusText,
            responseTime,
            data: proxyResult.data,
            headers: proxyResult.headers
          };

          setManualResult(result);

          // Сохраняем в историю
          const historyItem = {
            id: Date.now().toString(),
            serviceName: manualTest.serviceName,
            url: manualTest.url,
            method: manualTest.method,
            result,
            timestamp: new Date().toISOString()
          };

          const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
          history.unshift(historyItem);
          localStorage.setItem('testHistory', JSON.stringify(history.slice(0, 50)));
          
          return;
        }
      }

      // Обычный запрос без прокси
      const response = await fetch(manualTest.url, {
        method: manualTest.method,
        headers: parsedHeaders,
        body: manualTest.method !== 'GET' && manualTest.body ? manualTest.body : undefined,
        mode: 'cors'
      });

      const responseTime = Date.now() - startTime;
      let data;
      
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data,
        headers: Object.fromEntries(response.headers.entries())
      };

      setManualResult(result);

      // Сохраняем в историю
      const historyItem = {
        id: Date.now().toString(),
        serviceName: manualTest.serviceName,
        url: manualTest.url,
        method: manualTest.method,
        result,
        timestamp: new Date().toISOString()
      };

      const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
      history.unshift(historyItem);
      localStorage.setItem('testHistory', JSON.stringify(history.slice(0, 50)));

    } catch (error) {
      setManualResult({
        status: 0,
        statusText: 'Error',
        responseTime: 0,
        data: error instanceof Error ? error.message : 'Неизвестная ошибка',
        headers: {}
      });
    } finally {
      setManualLoading(false);
    }
  };

  const applyTestToManual = (test: ExecutableTest) => {
    setManualTest({
      serviceName: test.name,
      url: test.url,
      method: test.method as HttpMethod,
      headers: JSON.stringify(test.headers, null, 2),
      body: test.body || '',
      authType: test.auth_type as AuthType,
      bearerToken: test.auth_token || '',
      apiKey: test.auth_token || '',
      apiKeyHeader: 'X-API-Key',
      basicUsername: '',
      basicPassword: ''
    });
    setActiveTab('manual');
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

  const getCategoryColor = (category: string) => {
    const colors = {
      auth: 'bg-blue-100 text-blue-800',
      data: 'bg-green-100 text-green-800',
      search: 'bg-purple-100 text-purple-800',
      crud: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-500" />
            API Тестер
          </CardTitle>
          <CardDescription className="text-sm">
            Генерируйте тесты с помощью ИИ или создавайте вручную
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="ai-tests" className="flex items-center gap-1 text-xs">
                <Brain className="h-3 w-3" />
                AI Тесты ({generatedTests.length})
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-1 text-xs">
                <Settings className="h-3 w-3" />
                Ручной тест
              </TabsTrigger>
            </TabsList>

            {/* AI Tests Tab - Combined Generation and Tests */}
            <TabsContent value="ai-tests" className="space-y-4 mt-4">
              {/* AI Generation Section */}
              <div className="space-y-3 pb-4 border-b">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Создать тесты с помощью ИИ</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Например: GitHub, Telegram Bot, JSONPlaceholder..."
                      value={testServiceName}
                      onChange={(e) => setTestServiceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && generateExecutableTests()}
                      className="h-9 flex-1"
                    />
                    <Button 
                      onClick={generateExecutableTests} 
                      disabled={aiLoading || !testServiceName.trim()}
                      className="h-9"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Создаю...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-3 w-3" />
                          Создать
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={loadDemoTests} 
                      variant="outline"
                      className="h-9"
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Демо
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ИИ создаст готовые к запуску тесты для основных функций API
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 p-3">
                  <input
                    type="checkbox"
                    id="aiAnalysisUnified"
                    checked={aiAnalysisEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAiAnalysisEnabledState(enabled);
                      setAiAnalysisEnabled(enabled);
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="aiAnalysisUnified" className="flex-1 text-sm">
                    <span className="font-medium">AI анализ ответов</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (автоматически анализировать ответы)
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 p-3">
                  <input
                    type="checkbox"
                    id="corsProxyUnified"
                    checked={corsProxyEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setCorsProxyEnabledState(enabled);
                      setCorsProxyEnabled(enabled);
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="corsProxyUnified" className="flex-1 text-sm">
                    <span className="font-medium">Обход CORS блокировки</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (использовать прокси-сервис)
                    </span>
                  </label>
                </div>

                {corsProxyEnabled && (
                  <div className="ml-4">
                    <CorsProxySettings />
                  </div>
                )}
              </div>

              {/* Generated Tests Section */}
              {generatedTests.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">Нет сгенерированных тестов</p>
                  <p className="text-xs text-muted-foreground">
                    Введите название API выше или загрузите демо-тесты
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{generatedTests.length} готовых тестов</span>
                    <Button onClick={runAllTests} disabled={runningAll} size="sm">
                      <Play className="h-3 w-3 mr-1" />
                      {runningAll ? 'Выполняется...' : 'Запустить все'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {generatedTests.map((test) => {
                      const result = results[test.id];
                      const isExpanded = expandedResults[test.id];

                      return (
                        <Card key={test.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getStatusIcon(result)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">{test.name}</span>
                                    <Badge variant="outline" className={`${getCategoryColor(test.category)} text-xs px-1 py-0`}>
                                      {test.category}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs px-1 py-0">{test.method}</Badge>
                                  </div>
                                  <code className="text-xs bg-muted px-1 py-0.5 rounded truncate block max-w-md">
                                    {test.url}
                                  </code>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {result && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedResults(prev => ({ ...prev, [test.id]: !prev[test.id] }))}
                                    className="h-7 w-7 p-0"
                                  >
                                    {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => applyTestToManual(test)}
                                  className="h-7 w-7 p-0"
                                  title="Редактировать в ручном режиме"
                                >
                                  <Settings className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => runTest(test)}
                                  disabled={result?.status === 'running'}
                                  size="sm"
                                  className="h-7"
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Тест
                                </Button>
                              </div>
                            </div>

                            {result && isExpanded && (
                              <div className="mt-3 pt-3 border-t space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">Результат:</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {result.duration && <span>{result.duration}ms</span>}
                                    {result.actualStatus && (
                                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                        {result.actualStatus}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {result.error ? (
                                  <div className="bg-red-50 border border-red-200 rounded p-2">
                                    <div className="text-sm text-red-800">{result.error}</div>
                                  </div>
                                ) : result.response && (
                                  <div className="bg-muted rounded p-2 max-h-32 overflow-auto">
                                    <pre className="text-xs">
                                      {typeof result.response === 'string' 
                                        ? result.response 
                                        : JSON.stringify(result.response, null, 2)
                                      }
                                    </pre>
                                  </div>
                                )}

                                {/* AI Анализ для AI тестов */}
                                {result.response && (
                                  <AiAnalysis
                                    actualResponse={result.response}
                                    expectedResponse={test.expected_status ? { expectedStatus: test.expected_status } : undefined}
                                    testName={test.name}
                                    apiUrl={test.url}
                                    httpMethod={test.method}
                                    httpStatus={result.actualStatus}
                                  />
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Manual Test Tab */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Название сервиса</label>
                    <Input
                      value={manualTest.serviceName}
                      onChange={(e) => setManualTest(prev => ({ ...prev, serviceName: e.target.value }))}
                      placeholder="Например: GitHub API"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">HTTP Метод</label>
                    <select
                      value={manualTest.method}
                      onChange={(e) => setManualTest(prev => ({ ...prev, method: e.target.value as HttpMethod }))}
                      className="w-full h-9 px-3 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={manualTest.url}
                    onChange={(e) => setManualTest(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://api.example.com/endpoint"
                    className="h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Заголовки (JSON)</label>
                    <Textarea
                      value={manualTest.headers}
                      onChange={(e) => setManualTest(prev => ({ ...prev, headers: e.target.value }))}
                      placeholder='{"Content-Type": "application/json"}'
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Тело запроса</label>
                    <Textarea
                      value={manualTest.body}
                      onChange={(e) => setManualTest(prev => ({ ...prev, body: e.target.value }))}
                      placeholder='{"key": "value"}'
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Аутентификация</label>
                    <select
                      value={manualTest.authType}
                      onChange={(e) => setManualTest(prev => ({ ...prev, authType: e.target.value as AuthType }))}
                      className="w-full h-9 px-3 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="none">Без аутентификации</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="api-key">API Key</option>
                      <option value="basic">Basic Auth</option>
                    </select>
                  </div>
                  {manualTest.authType === 'bearer' && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Bearer Token</label>
                      <Input
                        type="password"
                        value={manualTest.bearerToken}
                        onChange={(e) => setManualTest(prev => ({ ...prev, bearerToken: e.target.value }))}
                        placeholder="your-bearer-token"
                        className="h-9"
                      />
                    </div>
                  )}
                  {manualTest.authType === 'api-key' && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Заголовок</label>
                        <Input
                          value={manualTest.apiKeyHeader}
                          onChange={(e) => setManualTest(prev => ({ ...prev, apiKeyHeader: e.target.value }))}
                          placeholder="X-API-Key"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">API Key</label>
                        <Input
                          type="password"
                          value={manualTest.apiKey}
                          onChange={(e) => setManualTest(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder="your-api-key"
                          className="h-9"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 p-3">
                  <input
                    type="checkbox"
                    id="aiAnalysisManual"
                    checked={aiAnalysisEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAiAnalysisEnabledState(enabled);
                      setAiAnalysisEnabled(enabled);
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="aiAnalysisManual" className="flex-1 text-sm">
                    <span className="font-medium">AI анализ ответов</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (автоматически анализировать ответы)
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 p-3">
                  <input
                    type="checkbox"
                    id="corsProxyManual"
                    checked={corsProxyEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setCorsProxyEnabledState(enabled);
                      setCorsProxyEnabled(enabled);
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="corsProxyManual" className="flex-1 text-sm">
                    <span className="font-medium">Обход CORS блокировки</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (использовать прокси-сервис)
                    </span>
                  </label>
                </div>

                {corsProxyEnabled && (
                  <CorsProxySettings />
                )}

                <Button 
                  onClick={runManualTest} 
                  disabled={manualLoading || !manualTest.url}
                  className="w-full"
                >
                  {manualLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Выполняется...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Выполнить тест
                    </>
                  )}
                </Button>

                {manualResult && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {manualResult.status >= 200 && manualResult.status < 300 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        Результат: {manualResult.status} {manualResult.statusText}
                      </CardTitle>
                      <CardDescription>
                        Время ответа: {manualResult.responseTime}ms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded p-3 max-h-64 overflow-auto">
                        <pre className="text-xs">
                          {typeof manualResult.data === 'string' 
                            ? manualResult.data 
                            : JSON.stringify(manualResult.data, null, 2)
                          }
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Анализ для ручного теста */}
                {manualResult && (
                  <AiAnalysis
                    actualResponse={manualResult.data}
                    testName={manualTest.serviceName}
                    apiUrl={manualTest.url}
                    httpMethod={manualTest.method}
                    httpStatus={manualResult.status}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}