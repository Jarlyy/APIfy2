'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Brain, Search, FileText, Zap, Play } from 'lucide-react';
import { ExecutableTestsPanelNew } from './ExecutableTestsPanelNew';

interface AIAnalyzerProps {
  onApiFound?: (apiInfo: any) => void;
  onTestGenerated?: (testData: any) => void;
}

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

export function AIAnalyzer({ onApiFound, onTestGenerated }: AIAnalyzerProps) {
  const [serviceName, setServiceName] = useState('');
  const [testServiceName, setTestServiceName] = useState('');
  const [apiDoc, setApiDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [executableTests, setExecutableTests] = useState<ExecutableTest[]>([]);
  const [useProxy, setUseProxy] = useState(false);

  const analyzeService = async () => {
    if (!serviceName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyzeService',
          data: { serviceName: serviceName.trim() }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      // Остаемся на вкладке search для отображения результата
    } catch (error) {
      console.error('Ошибка анализа:', error);
      setResult('Ошибка при анализе сервиса. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const generateReadyTests = async () => {
    if (!testServiceName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateTests',
          data: { serviceName: testServiceName.trim() }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      // Остаемся на вкладке generate для отображения результата
      
      // Попытаемся извлечь JSON тесты из ответа
      try {
        const jsonMatch = data.result.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const testsData = JSON.parse(jsonMatch[1]);
          onTestGenerated?.(testsData);
        }
      } catch (e) {
        console.log('Не удалось извлечь JSON тесты:', e);
      }
    } catch (error) {
      console.error('Ошибка генерации тестов:', error);
      setResult('Ошибка при генерации тестов. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const generateExecutableTests = async () => {
    if (!testServiceName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateExecutableTests',
          data: { serviceName: testServiceName.trim() }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Попытаемся распарсить JSON ответ
      try {
        let testsData;
        
        // Если ответ уже JSON
        if (typeof data.result === 'object') {
          testsData = data.result;
        } else {
          // Попытаемся найти JSON в тексте
          const jsonMatch = data.result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            testsData = JSON.parse(jsonMatch[0]);
          } else {
            // Попытаемся распарсить весь ответ как JSON
            testsData = JSON.parse(data.result);
          }
        }

        if (Array.isArray(testsData)) {
          setExecutableTests(testsData);
          // Остаемся на вкладке generate для отображения тестов
          onTestGenerated?.(testsData);
        } else {
          throw new Error('Ответ не является массивом тестов');
        }
      } catch (e) {
        console.error('Ошибка парсинга тестов:', e);
        setResult(`Получен ответ от AI, но не удалось распарсить тесты:\n\n${data.result}`);
        // Остаемся на вкладке generate для отображения ошибки
      }
    } catch (error) {
      console.error('Ошибка генерации исполняемых тестов:', error);
      setResult('Ошибка при генерации исполняемых тестов. Попробуйте еще раз.');
      // Остаемся на вкладке generate для отображения ошибки
    } finally {
      setLoading(false);
    }
  };

  const generateScenarios = async () => {
    if (!apiDoc.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateScenarios',
          data: { apiDoc: apiDoc.trim() }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      // Остаемся на вкладке analyze для отображения результата
    } catch (error) {
      console.error('Ошибка генерации:', error);
      setResult('Ошибка при генерации сценариев. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const extractExamples = async () => {
    if (!apiDoc.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extractExamples',
          data: { apiDoc: apiDoc.trim() }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      // Остаемся на вкладке analyze для отображения результата
    } catch (error) {
      console.error('Ошибка извлечения:', error);
      setResult('Ошибка при извлечении примеров. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Анализатор API
        </CardTitle>
        <CardDescription className="text-sm">
          Используйте ИИ для поиска API, анализа документации и генерации тестов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="search" className="flex items-center gap-1 text-xs">
              <Search className="h-3 w-3" />
              Найти API
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-1 text-xs">
              <Play className="h-3 w-3" />
              Создать тесты
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-1 text-xs">
              <Brain className="h-3 w-3" />
              Анализ документации
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-3 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название сервиса или API</label>
              <Input
                placeholder="Например: GitHub, Telegram Bot, Twitter API..."
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyzeService()}
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                ИИ найдет информацию об API: документацию, эндпоинты, аутентификацию
              </p>
            </div>
            <Button 
              onClick={analyzeService} 
              disabled={loading || !serviceName.trim()}
              className="w-full h-9"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Ищу информацию...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-3 w-3" />
                  Найти API и документацию
                </>
              )}
            </Button>
            
            {result && activeTab === 'search' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Результат поиска</Badge>
                </div>
                <div className="bg-muted p-3 rounded-lg max-h-64 overflow-auto">
                  <pre className="whitespace-pre-wrap text-xs">{result}</pre>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название API сервиса</label>
              <Input
                placeholder="Например: GitHub, Telegram Bot, JSONPlaceholder..."
                value={testServiceName}
                onChange={(e) => setTestServiceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateExecutableTests()}
              />
              <p className="text-xs text-muted-foreground">
                ИИ создаст готовые к запуску тесты для основных функций API
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={generateExecutableTests} 
                disabled={loading || !testServiceName.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создаю исполняемые тесты...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Создать готовые к запуску тесты
                  </>
                )}
              </Button>
              
              <Button 
                onClick={generateReadyTests} 
                disabled={loading || !testServiceName.trim()}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создаю описание...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Создать описание тестов
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Переключатель прокси */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium">Настройки выполнения тестов</h4>
                  <p className="text-xs text-muted-foreground">
                    Прокси помогает обойти CORS ограничения
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="useProxyAI"
                    checked={useProxy}
                    onCheckedChange={setUseProxy}
                  />
                  <label htmlFor="useProxyAI" className="text-xs cursor-pointer">
                    Использовать прокси
                  </label>
                </div>
              </div>

              <ExecutableTestsPanelNew 
                tests={executableTests}
                useProxy={useProxy}
                onTestRun={(testId, result) => {
                  console.log('Тест выполнен:', testId, result);
                }}
                onTestsLoad={(tests) => {
                  setExecutableTests(tests);
                }}
              />
            </div>

            {result && activeTab === 'generate' && executableTests.length === 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Описание тестов</Badge>
                </div>
                <div className="bg-muted p-4 rounded-lg max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Документация API или OpenAPI спецификация</label>
              <Textarea
                placeholder="Вставьте документацию API, OpenAPI спецификацию или ссылку на документацию..."
                value={apiDoc}
                onChange={(e) => setApiDoc(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                ИИ проанализирует документацию и создаст тестовые сценарии или извлечет примеры
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={generateScenarios} 
                disabled={loading || !apiDoc.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Генерирую...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Создать сценарии
                  </>
                )}
              </Button>
              
              <Button 
                onClick={extractExamples} 
                disabled={loading || !apiDoc.trim()}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Извлекаю...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Извлечь примеры
                  </>
                )}
              </Button>
            </div>

            {result && activeTab === 'analyze' && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Результат анализа</Badge>
                </div>
                <div className="bg-muted p-4 rounded-lg max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}