import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { DollarSign, Receipt } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AuthPage({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    business_name: ""
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <DollarSign className="absolute top-20 left-10 text-sky-300 opacity-20 float-animation" size={80} />
        <Receipt className="absolute bottom-20 right-10 text-purple-300 opacity-20 bill-flip-animation" size={80} />
        <DollarSign className="absolute top-40 right-20 text-orange-300 opacity-20 float-animation" size={60} style={{ animationDelay: '1s' }} />
        <Receipt className="absolute bottom-40 left-20 text-sky-300 opacity-20 bill-flip-animation" size={60} style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="glass rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl relative z-10" data-testid="auth-container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-300 to-purple-300 rounded-2xl mb-4">
            <Receipt className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">CashPulse</h1>
          <p className="text-gray-600">Modern billing made simple</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(true)}
            data-testid="login-tab-btn"
          >
            Login
          </Button>
          <Button
            type="button"
            variant={!isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(false)}
            data-testid="register-tab-btn"
          >
            Register
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                type="text"
                placeholder="Your Business Name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required={!isLogin}
                className="mt-1"
                data-testid="business-name-input"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1"
              data-testid="email-input"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="mt-1"
              data-testid="password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-400 to-purple-400 hover:from-sky-500 hover:to-purple-500 text-white"
            disabled={loading}
            data-testid="submit-auth-btn"
          >
            {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}