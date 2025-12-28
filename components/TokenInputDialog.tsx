'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Key, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface TokenPlaceholder {
  placeholder: string;
  description: string;
  type: 'token' | 'id' | 'key' | 'url';
  example?: string;
}

interface TokenInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tokens: Record<string, string>) => void;
  placeholders: TokenPlaceholder[];
  testName: string;
}

export function TokenInputDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  placeholders, 
  testName 
}: TokenInputDialogProps) {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const handleTokenChange = (placeholder: string, value: string) => {
    setTokens(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  const toggleTokenVisibility = (placeholder: string) => {
    setShowTokens(prev => ({
      ...prev,
      [placeholder]: !prev[placeholder]
    }));
  };

  const handleConfirm = () => {
    onConfirm(tokens);
    onClose();
  };

  const getPlaceholderIcon = (type: string) => {
    switch (type) {
      case 'token':
      case 'key':
        return <Key className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPlaceholderColor = (type: string) => {
    switch (type) {
      case 'token':
        return 'bg-blue-100 text-blue-800';
      case 'key':
        return 'bg-green-100 text-green-800';
      case 'id':
        return 'bg-purple-100 text-purple-800';
      case 'url':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isTokenType = (type: string) => type === 'token' || type === 'key';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-500" />
            Настройка токенов для теста
          </DialogTitle>
          <DialogDescription>
            Тест "{testName}" требует настройки токенов и параметров для выполнения
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {placeholders.map((placeholder) => (
            <div key={placeholder.placeholder} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={placeholder.placeholder} className="text-sm font-medium">
                  {placeholder.placeholder}
                </Label>
                <Badge 
                  variant="secondary" 
                  className={`${getPlaceholderColor(placeholder.type)} text-xs px-2 py-0`}
                >
                  {getPlaceholderIcon(placeholder.type)}
                  <span className="ml-1">{placeholder.type}</span>
                </Badge>
              </div>
              
              <div className="relative">
                <Input
                  id={placeholder.placeholder}
                  type={isTokenType(placeholder.type) && !showTokens[placeholder.placeholder] ? 'password' : 'text'}
                  placeholder={placeholder.example || `Введите ${placeholder.placeholder}`}
                  value={tokens[placeholder.placeholder] || ''}
                  onChange={(e) => handleTokenChange(placeholder.placeholder, e.target.value)}
                  className="pr-10"
                />
                {isTokenType(placeholder.type) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => toggleTokenVisibility(placeholder.placeholder)}
                  >
                    {showTokens[placeholder.placeholder] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {placeholder.description}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={placeholders.some(p => !tokens[p.placeholder]?.trim())}
          >
            Применить токены
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}