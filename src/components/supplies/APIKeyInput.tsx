
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

interface APIKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isLoading?: boolean;
}

const APIKeyInput: React.FC<APIKeyInputProps> = ({ onApiKeySubmit, isLoading = false }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      // Save to localStorage so it persists between refreshes
      localStorage.setItem('wb_api_key', apiKey);
      onApiKeySubmit(apiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // Check if there's a saved key in localStorage
  React.useEffect(() => {
    const savedKey = localStorage.getItem('wb_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <KeyRound className="mr-2 h-5 w-5" />
          API-ключ Wildberries
        </CardTitle>
        <CardDescription>
          Введите API-ключ от личного кабинета Wildberries для получения данных об остатках
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid gap-4">
            <Input
              type="password"
              placeholder="Введите API-ключ..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              API-ключ можно получить в личном кабинете Wildberries в разделе "Настройки &gt; Доступ к API".
              Ключ должен иметь доступ к категории "Аналитика".
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading || !apiKey.trim() || saved}>
            {isLoading ? (
              <>Загрузка...</>
            ) : saved ? (
              <>Сохранено ✓</>
            ) : (
              <>Сохранить ключ</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default APIKeyInput;
