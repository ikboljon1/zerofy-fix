
import React from "react";
import { Card } from "@/components/ui/card";
import SalesMetrics from "./SalesMetrics";
import SalesTable from "./SalesTable";
import SalesChart from "./SalesChart";
import { useEffect, useState } from "react";

// Mock data for sales
const mockSales = [
  {
    saleID: "WB123456789",
    supplierArticle: "ART12345",
    subject: "Футболка мужская",
    category: "Одежда",
    brand: "BrandName",
    techSize: "XL",
    barcode: "2000000000000",
    totalPrice: 1500,
    priceWithDisc: 1200,
    salePercent: 20,
    reportDate: "2023-06-01",
    warehouseName: "Коледино",
    countryName: "Россия",
    oblastOkrugName: "Москва",
    regionName: "Москва",
    saleDate: "2023-06-01",
    date: "2023-06-01",
    lastChangeDate: "2023-06-01",
    warehouseId: 123,
    odid: 123456789,
    isCancelSale: false,
    isReturned: false,
    isSupply: true,
    isRealSupply: true,
    orderType: "Заказ",
    sticker: "123456789",
    gNumber: "GN123456789",
    forPay: 1000,
    finishedPrice: 1200,
    spp: 10,
    kvwSalePrice: 1200,
    kvwSalePercent: 5,
    isKVW: false,
    isExpense: false,
    incomeId: 0,
    isReturn: false
  },
  {
    saleID: "WB123456790",
    supplierArticle: "ART12346",
    subject: "Джинсы мужские",
    category: "Одежда",
    brand: "BrandName",
    techSize: "32",
    barcode: "2000000000001",
    totalPrice: 2500,
    priceWithDisc: 2000,
    salePercent: 20,
    reportDate: "2023-06-02",
    warehouseName: "Электросталь",
    countryName: "Россия",
    oblastOkrugName: "Московская область",
    regionName: "Подмосковье",
    saleDate: "2023-06-02",
    date: "2023-06-02",
    lastChangeDate: "2023-06-02",
    warehouseId: 124,
    odid: 123456790,
    isCancelSale: false,
    isReturned: false,
    isSupply: true,
    isRealSupply: true,
    orderType: "Заказ",
    sticker: "123456790",
    gNumber: "GN123456790",
    forPay: 1800,
    finishedPrice: 2000,
    spp: 10,
    kvwSalePrice: 2000,
    kvwSalePercent: 5,
    isKVW: false,
    isExpense: false,
    incomeId: 0,
    isReturn: false
  },
  {
    saleID: "WB123456791",
    supplierArticle: "ART12347",
    subject: "Куртка мужская",
    category: "Верхняя одежда",
    brand: "BrandName",
    techSize: "L",
    barcode: "2000000000002",
    totalPrice: 5000,
    priceWithDisc: -5000,
    salePercent: 0,
    reportDate: "2023-06-03",
    warehouseName: "Коледино",
    countryName: "Россия",
    oblastOkrugName: "Москва",
    regionName: "Москва",
    saleDate: "2023-06-03",
    date: "2023-06-03",
    lastChangeDate: "2023-06-03",
    warehouseId: 123,
    odid: 123456791,
    isCancelSale: false,
    isReturned: true,
    isSupply: true,
    isRealSupply: true,
    orderType: "Возврат",
    sticker: "123456791",
    gNumber: "GN123456791",
    forPay: -4500,
    finishedPrice: -5000,
    spp: 10,
    kvwSalePrice: -5000,
    kvwSalePercent: 0,
    isKVW: false,
    isExpense: false,
    incomeId: 0,
    isReturn: true
  }
];

const SalesAnalytics: React.FC = () => {
  const [sales, setSales] = useState(mockSales);
  const [isLoading, setIsLoading] = useState(false);

  // In a real application, you would fetch the sales data here
  useEffect(() => {
    // Simulating loading state
    setIsLoading(true);
    
    // Mock API call
    const fetchData = async () => {
      try {
        // Here you would normally fetch data from API
        // const response = await fetch('/api/sales');
        // const data = await response.json();
        
        // Using mock data instead
        setTimeout(() => {
          setSales(mockSales);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching sales data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SalesMetrics sales={sales} />
      <SalesChart sales={sales} />
      <SalesTable sales={sales} />
    </div>
  );
};

export default SalesAnalytics;
