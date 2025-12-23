'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Search, FileText, Zap } from 'lucide-react';

interface AIAnalyzerProps {
  onApiFound?: (apiInfo: any) => void;
  onTestGenerated?: (testData: any) => void;
}

export function AIAnalyzer({ onApiFound, onTestGenerated }: AIAnalyzerProps) {
  const [serviceName, setServiceName] = useState('');
  const [testServiceName, setTestServiceName] = useState('');
  const [apiDoc, setApiDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('search');

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
      setActiveTab('result');
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
      setActiveTab('result');
      
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
      setActiveTab('result');
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
      setActiveTab('result');
    } catch (error) {
      console.error('Ошибка извлечения:', error);
      setResult('Ошибка при извлечении примеров. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Анализатор API
        </CardTitle>
        <CardDescription>
          Используйте ИИ для поиска API, анализа документации и генерации тестов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="search" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              Поиск API
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Готовые тесты
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Сценарии
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Примеры
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              Результат
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название сервиса</label>
              <Input
                placeholder="Например: GitHub, Telegram, VK API..."
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyzeService()}
              />
            </div>
            <Button 
              onClick={analyzeService} 
              disabled={loading || !serviceName.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Найти API
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название API сервиса</label>
              <Input
                placeholder="Например: GitHub, Telegram Bot, Twitter API..."
                value={testServiceName}
                onChange={(e) => setTestServiceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateReadyTests()}
              />
              <p className="text-xs text-muted-foreground">
                ИИ создаст готовые к использованию тесты для популярных API
              </p>
            </div>
            <Button 
              onClick={generateReadyTests} 
              disabled={loading || !testServiceName.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерирую тесты...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Создать готовые тесты
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Документация API</label>
              <Textarea
                placeholder="Вставьте документацию API или OpenAPI спецификацию..."
                value={apiDoc}
                onChange={(e) => setApiDoc(e.target.value)}
                rows={8}
              />
            </div>
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
                  Создать тестовые сценарии
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Документация API</label>
              <Textarea
                placeholder="Вставьте документацию API для извлечения примеров..."
                value={apiDoc}
                onChange={(e) => setApiDoc(e.target.value)}
                rows={8}
              />
            </div>
            <Button 
              onClick={extractExamples} 
              disabled={loading || !apiDoc.trim()}
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
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Результат анализа</Badge>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Выберите действие на других вкладках для получения результата
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}