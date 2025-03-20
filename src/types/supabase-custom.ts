
// Custom type definitions for Supabase tables
export interface Profile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  tariff_id: string;
  is_in_trial: boolean;
  trial_end_date: string;
  is_subscription_active: boolean;
  store_count?: number;
}

export interface Tariff {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly' | 'weekly' | 'daily';
  description: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  store_limit: number;
  created_at?: string;
  updated_at?: string;
}

export interface Store {
  store_id: string;
  user_id: string;
  marketplace: string;
  name: string;
  api_key: string;
  is_selected: boolean;
  last_fetch_date: string;
}

export interface StoreStats {
  store_id: string;
  date_from: string;
  date_to: string;
  data: any;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  tariff_id: string;
  amount: number;
  payment_date: string;
  period_months: number;
  payment_method: string;
  status: string;
}
