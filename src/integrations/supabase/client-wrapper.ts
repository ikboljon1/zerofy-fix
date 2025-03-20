
import { supabase } from "@/integrations/supabase/client";
import type { PostgrestFilterBuilder } from "@supabase/supabase-js";
import type { Profile, Tariff, Store, StoreStats, PaymentHistory } from "@/types/supabase-custom";

// Create type-safe table accessors
export const getProfiles = () => supabase.from('profiles') as unknown as ReturnType<typeof supabase.from<Profile>>;
export const getTariffs = () => supabase.from('tariffs') as unknown as ReturnType<typeof supabase.from<Tariff>>;
export const getStores = () => supabase.from('stores') as unknown as ReturnType<typeof supabase.from<Store>>;
export const getStoreStats = () => supabase.from('store_stats') as unknown as ReturnType<typeof supabase.from<StoreStats>>;
export const getPaymentHistory = () => supabase.from('payment_history') as unknown as ReturnType<typeof supabase.from<PaymentHistory>>;

// Export the original supabase client for auth and other operations
export { supabase };
