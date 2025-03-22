import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestPasswordReset } from "@/services/userService";
import { Mail } from "lucide-react";

const PasswordResetRequestForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const result = await requestPasswordReset(email);
      
      // Update to handle the object response instead of boolean
      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Ссылка отправлена",
          description: "Проверьте вашу электронную почту. Ссылка для сброса пароля будет действительна в течение 24 часов.",
        });
      } else {
        setError(result.message || "Произошла ошибка при отправке ссылки для сброса пароля.");
      }
    } catch (error: any) {
      setError(error.message || "Произошла ошибка при отправке ссылки для сброса пароля.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Запрос сброса пароля</CardTitle>
        <CardDescription>
          Введите свой email, и мы отправим вам ссылку для сброса пароля.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Введите свой email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting || isSuccess}
          />
        </div>
        <Button disabled={isSubmitting || isSuccess} onClick={handleSubmit}>
          {isSubmitting ? "Отправка..." : "Отправить ссылку"}
        </Button>
        {error && <p className="text-red-500">{error}</p>}
        {isSuccess && (
          <p className="text-green-500">
            Ссылка для сброса пароля отправлена на ваш email.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordResetRequestForm;
