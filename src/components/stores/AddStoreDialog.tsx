import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewStore, marketplaces } from "@/types/store";
import { PlusCircle, ShoppingBag, AlertTriangle, Package2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { validateApiKey, canAddNewStore } from "@/utils/storeUtils";
import { toast } from "sonner";

interface AddStoreDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStore: (store: NewStore) => void;
  storeCount: number;
  storeLimit: number;
}

export function AddStoreDialog({ 
  isOpen, 
  isLoading, 
  onOpenChange, 
  onAddStore,
  storeCount,
  storeLimit
}: AddStoreDialogProps) {
  const [storeName, setStoreName] = useState("");
  const [marketplace, setMarketplace] = useState<string>("Wildberries");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyValidationStatus, setApiKeyValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [canAddStore, setCanAddStore] = useState<boolean>(true);
  const [addStoreError, setAddStoreError] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserId(user.id);
        
        const addStoreStatus = canAddNewStore(user.id);
        setCanAddStore(addStoreStatus.canAdd);
        setAddStoreError(addStoreStatus.reason || null);
      } catch (error) {
        console.error("Ошибка получения ID пользователя:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStoreName("");
      setMarketplace("Wildberries");
      setApiKey("");
      setApiKeyValidationStatus("idle");
      setValidationError(null);
      
      if (userId) {
        const addStoreStatus = canAddNewStore(userId);
        setCanAddStore(addStoreStatus.canAdd);
        setAddStoreError(addStoreStatus.reason || null);
      }
    }
  }, [isOpen, userId]);

  const validateKey = async () => {
    if (!apiKey) return false;
    
    setApiKeyValidationStatus("validating");
    setValidationError(null);
    
    const result = await validateApiKey(apiKey);
    
    if (result.isValid) {
      setApiKeyValidationStatus("valid");
      return true;
    } else {
      setApiKeyValidationStatus("invalid");
      setValidationError(result.errorMessage || "API ключ не прошел проверку");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateKey();
    if (!isValid) {
      toast.error(validationError || "API ключ не прошел проверку", {
        duration: 4000,
      });
      return;
    }
    
    onAddStore({
      name: storeName,
      marketplace: marketplace as any,
      apiKey,
      userId
    });
  };

  const resetForm = () => {
    setStoreName("");
    setMarketplace("Wildberries");
    setApiKey("");
    setApiKeyValidationStatus("idle");
    setValidationError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const isAtStoreLimit = storeCount >= storeLimit || !canAddStore;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isAtStoreLimit}>
          <PlusCircle className="h-4 w-4" />
          <span>Добавить магазин</span>
          {storeCount > 0 && (
            <Badge variant="outline" className="ml-1 bg-blue-950/30 text-blue-400 border-blue-800">
              <span>{storeCount}/{storeLimit}</span>
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <DialogTitle>Добавить новый магазин</DialogTitle>
          </div>
        </DialogHeader>
        
        {isAtStoreLimit && (
          <Alert className="bg-yellow-900/20 border-yellow-800/30 text-yellow-300">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              {addStoreError || `Вы достигли лимита магазинов (${storeLimit}) для вашего тарифа. Перейдите на более высокий тариф, чтобы добавить больше магазинов.`}
            </AlertDescription>
          </Alert>
        )}
        
        {!isAtStoreLimit && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="name">Название магазина</Label>
                <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-950/30 text-blue-400 border-blue-800">
                  <Package2 className="h-3.5 w-3.5" />
                  <span>{storeCount}/{storeLimit}</span>
                </Badge>
              </div>
              <Input
                id="name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Введите название магазина"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketplace">Маркетплейс</Label>
              <Select value={marketplace} onValueChange={setMarketplace}>
                <SelectTrigger id="marketplace">
                  <SelectValue placeholder="Выберите маркетплейс" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="Wildberries" value="Wildberries">
                    Wildberries
                  </SelectItem>
                  
                  {marketplaces.filter(mp => mp !== "Wildberries").map((mp) => (
                    <SelectItem key={mp} value={mp} disabled className="opacity-60 cursor-not-allowed">
                      <div className="flex items-center gap-1.5">
                        <span>{mp}</span>
                        <Badge variant="outline" className="ml-1 px-1.5 py-0 h-5 bg-amber-950/20 text-amber-300 border-amber-800/50 text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>скоро</span>
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                API ключ
                {apiKeyValidationStatus === "validating" && (
                  <Badge variant="outline" className="ml-1 px-2 py-0 h-5 bg-blue-950/20 text-blue-300 border-blue-800/50 text-xs flex items-center">
                    <span className="animate-pulse">Проверка...</span>
                  </Badge>
                )}
                {apiKeyValidationStatus === "valid" && (
                  <Badge variant="outline" className="ml-1 px-2 py-0 h-5 bg-green-950/20 text-green-300 border-green-800/50 text-xs flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    <span>Ключ валиден</span>
                  </Badge>
                )}
                {apiKeyValidationStatus === "invalid" && (
                  <Badge variant="outline" className="ml-1 px-2 py-0 h-5 bg-red-950/20 text-red-300 border-red-800/50 text-xs flex items-center">
                    <XCircle className="h-3 w-3 mr-1 text-red-500" />
                    <span>Ключ невалиден</span>
                  </Badge>
                )}
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={validateKey}
                placeholder="Введите API ключ"
              />
              {apiKeyValidationStatus === "invalid" && (
                <div className="text-sm text-red-400 mt-1 flex items-start gap-1.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{validationError || "API ключ не прошел проверку. Пожалуйста, убедитесь, что ключ корректен."}</p>
                </div>
              )}
            </div>
            
            {!isLoading && (
              <Alert variant="default" className="bg-yellow-900/20 border-yellow-800/30 text-yellow-300">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription>
                  Удаление магазина будет доступно только через 1 месяц после активации тарифа
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="mr-2">
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !storeName || !marketplace || !apiKey || apiKeyValidationStatus === "validating" || apiKeyValidationStatus === "invalid"}
              >
                {isLoading ? "Добавление..." : "Добавить"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
