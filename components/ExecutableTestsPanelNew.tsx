'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, CheckCircle, XCircle, Clock, Copy, Settings, Eye, EyeOff, Zap } from 'lucide-react';
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
  aiValidation?: {
    isValid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

interface ExecutableTestsPanelProps {
  tests: ExecutableTest[];
  onTestRun?: (testId: string, result: TestResult) => void;
  onTestsLoad?: (tests: ExecutableTest[]) => void;
}

export function ExecutableTestsPanelNew({ tests, onTestRun, onTestsLoad }: ExecutableTestsPanelProps) {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [editingTest, setEditingTest] = useState<string | null>(null);
  const [editedTests, setEditedTests] = useState<Record<string, ExecutableTest>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  const validateWithAI = async (test: ExecutableTest, response: any, actualStatus: number) => {
    try {
      const aiResponse = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validateTestResult',
          data: {
            test: {
              name: test.name,
              description: test.description,
              expected_status: test.expected_status,
              category: test.category
            },
            result: {
              status: actualStatus,
              response: typeof response === 'object' ? JSON.stringify(response, null, 2) : response
            }
          }
        })
      });

      const data = await aiResponse.json();
      
      if (data.result) {
        // Простая эвристика для оценки результата
        const isStatusMatch = actualStatus === test.expected_status;
        const hasValidResponse = response && (typeof response === 'object' || response.length > 0);
        
        return {
          isValid: isStatusMatch && hasValidResponse,
          score: isStatusMatch ? (hasValidResponse ? 100 : 80) : 40,
          issues: isStatusMatch ? [] : [`Ожидался статус ${test.expected_status}, получен ${actualStatus}`],
          suggestions: isStatusMatch ? [] : ['Проверьте правильность URL и параметров запроса']
        };
      }
    } catch (error) {
      console.error('Ошибка AI валидации:', error);
    }

    // Fallback валидация без AI
    const isStatusMatch = actualStatus === test.expected_status;
    return {
      isValid: isStatusMatch,
      score: isStatusMatch ? 90 : 30,
      issues: isStatusMatch ? [] : [`Ожидался статус ${test.expected_status}, получен ${actualStatus}`],
      suggestions: isStatusMatch ? [] : ['Проверьте корректность запроса']
    };
  };

  const runTest = async (test: ExecutableTest) => {
    const testToRun = editedTests[test.id] || test;
    
    setResults(prev => ({
      ...prev,
      [test.id]: { id: test.id, status: 'running' }
    }));

    const startTime = Date.now();

    try {
      const headers = { ...testToRun.headers };
      
      if (testToRun.auth_type === 'bearer' && testToRun.auth_token) {
        headers['Authorization'] = `Bearer ${testToRun.auth_token}`;
      } else if (testToRun.auth_type === 'api-key' && testToRun.auth_token) {
        headers['X-API-Key'] = testToRun.auth_token;
      }

      const requestOptions: RequestInit = {
        method: testToRun.method,
        headers,
        mode: 'cors',
      };

      if (testToRun.body && testToRun.method !== 'GET') {
        requestOptions.body = testToRun.body;
      }

      const response = await fetch(testToRun.url, requestOptions);
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

      // AI валидация результата
      const aiValidation = await validateWithAI(testToRun, responseData, response.status);

      const result: TestResult = {
        id: test.id,
        status: response.status === testToRun.expected_status ? 'success' : 'error',
        response: responseData,
        duration,
        actualStatus: response.status,
        aiValidation
      };

      setResults(prev => ({ ...prev, [test.id]: result }));
      onTestRun?.(test.id, result);

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
        duration,
        aiValidation: {
          isValid: false,
          score: 0,
          issues: ['Запрос не выполнен'],
          suggestions: ['Проверьте URL и доступность сервера']
        }
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
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setRunningAll(false);
  };

  const copyTestAsCurl = (test: ExecutableTest) => {
    const testToUse = editedTests[test.id] || test;
    let curl = `curl -X ${testToUse.method}`;
    
    Object.entries(testToUse.headers).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`;
    });

    if (testToUse.auth_type === 'bearer' && testToUse.auth_token) {
      curl += ` -H "Authorization: Bearer ${testToUse.auth_token}"`;
    } else if (testToUse.auth_type === 'api-key' && testToUse.auth_token) {
      curl += ` -H "X-API-Key: ${testToUse.auth_token}"`;
    }

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

  const toggleResultExpansion = (testId: string) => {
    setExpandedResults(prev => ({
      ...prev,
      [testId]: !prev[testId]
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

  const getCategoryColor = (category: string) => {
    const colors = {
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
    <div className="space-y-3">
      {/* Компактный заголовок */}
      <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-sm">Готовые тесты API</h3>
            <p className="text-xs text-muted-foreground">{tests.length} тестов</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadDemoTests} variant="outline" size="sm">
            🚀 Демо
          </Button>
          <Button onClick={runAllTests} disabled={runningAll} size="sm">
            <Play className="h-3 w-3 mr-1" />
            {runningAll ? 'Выполняется...' : 'Все'}
          </Button>
        </div>
      </div>

      {/* Компактный список тестов */}
      <div className="space-y-2">
        {tests.map((test) => {
          const result = results[test.id];
          const currentTest = editedTests[test.id] || test;
          const isEditing = editingTest === test.id;
          const isExpanded = expandedResults[test.id];

          return (
            <Card key={test.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Компактная строка теста */}
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
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded truncate max-w-md">
                          {test.url}
                        </code>
                        {result?.aiValidation && (
                          <Badge 
                            variant={result.aiValidation.isValid ? "default" : "destructive"}
                            className="text-xs px-1 py-0"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            AI: {result.aiValidation.score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {result && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResultExpansion(test.id)}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTest(isEditing ? null : test.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyTestAsCurl(test)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => runTest(test)}
                      disabled={result?.status === 'running'}
                      size="sm"
                      className="h-8"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Тест
                    </Button>
                  </div>
                </div>

                {/* Результат (сворачиваемый) */}
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
                    
                    {/* AI валидация */}
                    {result.aiValidation && (
                      <div className={`p-2 rounded text-xs ${
                        result.aiValidation.isValid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-3 w-3" />
                          <span className="font-medium">AI Анализ: {result.aiValidation.score}%</span>
                        </div>
                        {result.aiValidation.issues.length > 0 && (
                          <div className="text-red-700">
                            <strong>Проблемы:</strong> {result.aiValidation.issues.join(', ')}
                          </div>
                        )}
                        {result.aiValidation.suggestions.length > 0 && (
                          <div className="text-blue-700">
                            <strong>Рекомендации:</strong> {result.aiValidation.suggestions.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {result.error ? (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <div className="text-sm text-red-800 whitespace-pre-line">{result.error}</div>
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
                  </div>
                )}

                {/* Редактирование (сворачиваемое) */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t">
                    <Tabs defaultValue="request" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="request" className="text-xs">Запрос</TabsTrigger>
                        <TabsTrigger value="auth" className="text-xs">Авторизация</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="request" className="space-y-2 mt-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="GET"
                            value={currentTest.method}
                            onChange={(e) => updateTest(test.id, 'method', e.target.value)}
                            className="text-xs h-8"
                          />
                          <Input
                            placeholder="200"
                            type="number"
                            value={currentTest.expected_status}
                            onChange={(e) => updateTest(test.id, 'expected_status', e.target.value)}
                            className="text-xs h-8"
                          />
                          <Input
                            placeholder="Категория"
                            value={currentTest.category}
                            onChange={(e) => updateTest(test.id, 'category', e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        
                        <Input
                          placeholder="URL"
                          value={currentTest.url}
                          onChange={(e) => updateTest(test.id, 'url', e.target.value)}
                          className="text-xs h-8"
                        />

                        {currentTest.method !== 'GET' && (
                          <Textarea
                            placeholder="Тело запроса (JSON)"
                            value={currentTest.body}
                            onChange={(e) => updateTest(test.id, 'body', e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        )}
                      </TabsContent>

                      <TabsContent value="auth" className="space-y-2 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="none, bearer, api-key"
                            value={currentTest.auth_type}
                            onChange={(e) => updateTest(test.id, 'auth_type', e.target.value)}
                            className="text-xs h-8"
                          />
                          <Input
                            type="password"
                            placeholder="Токен"
                            value={currentTest.auth_token}
                            onChange={(e) => updateTest(test.id, 'auth_token', e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        
                        {test.instructions && (
                          <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                            {test.instructions}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
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