
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  delay?: number;
  iconColor?: string;
  iconBgColor?: string;
}

const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  delay = 0,
  iconColor = "text-indigo-600 dark:text-indigo-400",
  iconBgColor = "bg-indigo-100 dark:bg-indigo-900/30"
}) => {
  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={chartVariants} 
      transition={{ duration: 0.5, delay }}
    >
      <Card className="overflow-hidden rounded-xl border shadow-md bg-white dark:bg-slate-900">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2.5">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full ${iconBgColor} shadow-sm p-2`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <span className={iconColor}>
                {title}
              </span>
            </CardTitle>
            {subtitle && (
              <div className="text-xs font-medium text-white px-3 py-1 rounded-full shadow-sm bg-indigo-500 dark:bg-indigo-600">
                {subtitle}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] mt-4">
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BarChartCard;
