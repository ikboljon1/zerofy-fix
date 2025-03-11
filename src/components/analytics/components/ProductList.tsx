
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, DollarSign, FileText, Info, Image } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  name: string;
  price: string;
  profit: string;
  image: string;
  quantitySold?: number;
  margin?: number;
  returnCount?: number;
  category?: string;
}

interface ProductListProps {
  title: string;
  products: Product[] | undefined;
  isProfitable: boolean;
}

const ProductList = ({ title, products = [], isProfitable }: ProductListProps) => {
  const isMobile = useIsMobile();
  const textColorClass = isProfitable 
    ? "text-green-600 dark:text-green-400" 
    : "text-red-600 dark:text-red-400";
  
  const bgGradientClass = isProfitable
    ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-100 dark:border-green-800/30"
    : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-100 dark:border-red-800/30";

  const IconComponent = isProfitable ? TrendingUp : TrendingDown;

  const formatNumberWithSign = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(numValue)) return value;
    
    return isProfitable 
      ? `+${formatCurrency(numValue)}` 
      : formatCurrency(numValue);
  };

  // Improved text encoding function
  const safeText = (text: string | undefined): string => {
    if (!text) return "Нет данных";
    
    try {
      // First decode if already encoded to prevent double encoding
      const decoded = decodeURIComponent(text);
      // Then encode again to ensure consistency
      return decodeURIComponent(encodeURIComponent(decoded));
    } catch (e) {
      // If any encoding/decoding error, return the original text
      return text;
    }
  };

  const getProfitabilityReason = (product: Product) => {
    if (isProfitable) {
      if (product.quantitySold && product.quantitySold > 50) {
        return "Высокие объемы продаж";
      } else if (product.returnCount !== undefined && product.returnCount < 3) {
        return "Низкое количество возвратов";
      }
      return "Стабильные продажи";
    } else {
      if (product.returnCount !== undefined && product.returnCount > 10) {
        return "Высокое количество возвратов";
      } else if (product.quantitySold && product.quantitySold < 5) {
        return "Низкие объемы продаж";
      }
      return "Нестабильные продажи";
    }
  };

  return (
    <Card className={`p-4 ${isMobile ? 'p-3' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{safeText(title)}</h3>
        <div className={`p-2 rounded-md ${isProfitable ? 'bg-green-100 dark:bg-green-900/60' : 'bg-red-100 dark:bg-red-900/60'}`}>
          <IconComponent className={`h-4 w-4 ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
        </div>
      </div>
      <div className="space-y-4">
        {products && products.length > 0 ? (
          products.map((product, index) => (
            <div 
              key={index} 
              className={`flex flex-col p-4 rounded-lg border ${bgGradientClass}`}
            >
              <div className="flex items-start mb-2">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 mr-4 bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={product.image || "https://storage.googleapis.com/a1aa/image/Fo-j_LX7WQeRkTq3s3S37f5pM6wusM-7URWYq2Rq85w.jpg"} 
                    alt={safeText(product.name)} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://storage.googleapis.com/a1aa/image/Fo-j_LX7WQeRkTq3s3S37f5pM6wusM-7URWYq2Rq85w.jpg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-base">{safeText(product.name || "Неизвестный товар")}</h4>
                    <div className="text-right flex items-center">
                      <span className={`${textColorClass} font-semibold mr-1`}>
                        {formatNumberWithSign(product.profit)}
                      </span>
                      {isProfitable ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Цена: {formatCurrency(parseFloat(product.price || "0"))}
                  </p>
                  {product.category && (
                    <p className="text-sm text-muted-foreground">
                      Категория: {safeText(product.category)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>
                    Продано: {product.quantitySold !== undefined ? `${product.quantitySold} шт.` : 'Н/Д'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <ArrowDown className={`h-4 w-4 mr-1 ${product.returnCount && product.returnCount > 5 ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span>
                    Возвраты: {product.returnCount !== undefined ? `${product.returnCount} шт.` : 'Н/Д'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="font-medium">
                    {safeText(getProfitabilityReason(product))}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 px-4 text-center text-muted-foreground">
            <div className="flex flex-col items-center">
              <Image className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
              <p>Нет данных за выбранный период</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductList;
