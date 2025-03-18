
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAISettings, saveAISettings, getAvailableProviders, getAvailableModels } from "@/services/aiService";
import { AISettings, AIModel } from "@/types/ai";

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Локализация
const localization = {
  ru: {
    title: "Настройки AI-анализа данных",
    description: "Настройте параметры использования искусственного интеллекта для анализа данных вашего магазина",
    enableAI: "Включить AI-анализ",
    provider: "Провайдер AI",
    selectProvider: "Выберите провайдера",
    model: "Модель AI",
    selectModel: "Выберите модель",
    apiKey: "API ключ",
    enterApiKey: "Введите ваш API ключ",
    apiKeyNote: "Ваш API ключ хранится только локально в браузере и не передается никуда, кроме API выбранного провайдера.",
    testConnection: "Проверить соединение",
    testing: "Проверка...",
    saveSettings: "Сохранить настройки",
    show: "Показать",
    hide: "Скрыть",
    language: "Язык",
  },
  en: {
    title: "AI Analysis Settings",
    description: "Configure AI parameters for your store data analysis",
    enableAI: "Enable AI Analysis",
    provider: "AI Provider",
    selectProvider: "Select provider",
    model: "AI Model",
    selectModel: "Select model",
    apiKey: "API Key",
    enterApiKey: "Enter your API key",
    apiKeyNote: "Your API key is stored only locally in the browser and is not transmitted anywhere except to the selected provider's API.",
    testConnection: "Test Connection",
    testing: "Testing...",
    saveSettings: "Save Settings",
    show: "Show",
    hide: "Hide",
    language: "Language",
  }
};

const AISettingsDialog = ({ open, onOpenChange }: AISettingsDialogProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const providers = getAvailableProviders();
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  const texts = localization[language];

  useEffect(() => {
    if (open) {
      setSettings(getAISettings());
    }
  }, [open]);

  useEffect(() => {
    // Update available models when provider changes
    const models = getAvailableModels(settings.provider);
    setAvailableModels(models);
    
    // Set default model for provider if current model doesn't belong to selected provider
    const currentModelBelongsToProvider = models.some(model => model.id === settings.model);
    if (!currentModelBelongsToProvider && models.length > 0) {
      setSettings(prev => ({...prev, model: models[0].id}));
    }
  }, [settings.provider]);

  const handleSave = () => {
    try {
      saveAISettings(settings);
      
      toast({
        title: language === 'ru' ? "Настройки сохранены" : "Settings saved",
        description: settings.isEnabled 
          ? (language === 'ru' ? "AI-анализ данных включен" : "AI data analysis enabled") 
          : (language === 'ru' ? "AI-анализ данных отключен" : "AI data analysis disabled"),
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Не удалось сохранить настройки" : "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    
    try {
      // Упрощенный тест соединения в зависимости от провайдера
      if (!settings.apiKey) {
        throw new Error(language === 'ru' ? "API ключ не указан" : "API key not provided");
      }
      
      let testUrl = '';
      let headers: Record<string, string> = {};
      
      switch (settings.provider) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/models';
          headers = {
            'Authorization': `Bearer ${settings.apiKey}`
          };
          break;
        case 'gemini':
          // Для Google Gemini API
          testUrl = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + settings.apiKey;
          break;
        case 'anthropic':
          // Для Anthropic Claude API
          testUrl = 'https://api.anthropic.com/v1/messages';
          headers = {
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01'
          };
          break;
      }
      
      const response = await fetch(testUrl, { headers });
      
      if (!response.ok) {
        throw new Error(language === 'ru' 
          ? `Ошибка соединения: ${response.status} ${response.statusText}` 
          : `Connection error: ${response.status} ${response.statusText}`);
      }
      
      toast({
        title: language === 'ru' ? "Соединение установлено" : "Connection established",
        description: language === 'ru' ? "API ключ работает корректно" : "API key works correctly",
      });
    } catch (error) {
      console.error(language === 'ru' ? 'Ошибка при тестировании соединения:' : 'Error testing connection:', error);
      toast({
        title: language === 'ru' ? "Ошибка соединения" : "Connection error",
        description: error instanceof Error ? error.message : (language === 'ru' ? "Не удалось установить соединение с API" : "Failed to connect to API"),
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === settings.provider);
  const selectedModel = availableModels.find(m => m.id === settings.model);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <div className="flex justify-end mb-2">
          <Select value={language} onValueChange={(value: string) => setLanguage(value as 'ru' | 'en')}>
            <SelectTrigger className="w-[120px]">
              <span className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                {texts.language}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
          <DialogDescription>
            {texts.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-enabled" className="text-base">{texts.enableAI}</Label>
            <Switch
              id="ai-enabled"
              checked={settings.isEnabled}
              onCheckedChange={(checked) => setSettings({...settings, isEnabled: checked})}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="ai-provider">{texts.provider}</Label>
            <Select 
              value={settings.provider} 
              onValueChange={(value) => setSettings({...settings, provider: value})}
            >
              <SelectTrigger id="ai-provider">
                <SelectValue placeholder={texts.selectProvider} />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProvider && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProvider.description}
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="ai-model">{texts.model}</Label>
            <Select 
              value={settings.model} 
              onValueChange={(value) => setSettings({...settings, model: value})}
              disabled={availableModels.length === 0}
            >
              <SelectTrigger id="ai-model">
                <SelectValue placeholder={texts.selectModel} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel && selectedModel.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedModel.description}
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="api-key">{texts.apiKey}</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowApiKey(!showApiKey)}
                className="h-6 px-2"
              >
                {showApiKey ? texts.hide : texts.show}
              </Button>
            </div>
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={settings.apiKey}
              onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
              placeholder={texts.enterApiKey}
            />
            <p className="text-xs text-muted-foreground">
              {texts.apiKeyNote}
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={testConnection} 
            disabled={isTesting || !settings.apiKey}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {texts.testing}
              </>
            ) : (
              texts.testConnection
            )}
          </Button>
          <Button onClick={handleSave}>{texts.saveSettings}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AISettingsDialog;
