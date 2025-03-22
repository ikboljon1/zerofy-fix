
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    
    const { method, payment, userId, tariffId, months } = await req.json();
    
    // Получаем информацию о пользователе
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (profileError) {
      return new Response(
        JSON.stringify({ success: false, error: "Пользователь не найден" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (method === "add") {
      // Добавляем запись о платеже
      const { data: paymentData, error: paymentError } = await supabaseClient
        .from("payment_history")
        .insert({
          user_id: userId,
          amount: payment.amount,
          subscription_type: tariffId, 
          status: "completed",
          payment_method: payment.method || "card"
        })
        .select()
        .single();
        
      if (paymentError) {
        console.error("Payment insertion error:", paymentError);
        return new Response(
          JSON.stringify({ success: false, error: paymentError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      
      // Вычисляем дату окончания подписки
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months);
      
      // Обновляем профиль пользователя - устанавливаем новый тариф и дату окончания
      const { data: updatedProfile, error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          subscription_type: tariffId,
          subscription_expiry: subscriptionEndDate.toISOString()
        })
        .eq("id", userId)
        .select()
        .single();
        
      if (updateError) {
        console.error("Profile update error:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          payment: paymentData,
          user: updatedProfile
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    else if (method === "get") {
      // Получаем историю платежей пользователя
      const { data: payments, error: paymentsError } = await supabaseClient
        .from("payment_history")
        .select("*")
        .eq("user_id", userId)
        .order("payment_date", { ascending: false });
        
      if (paymentsError) {
        return new Response(
          JSON.stringify({ success: false, error: paymentsError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, payments }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: "Метод не поддерживается" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
