import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, Lock, Mail, Receipt } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login with Supabase
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        toast.error(error.message || "Login failed. Please check your credentials.");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <DollarSign className="absolute top-20 left-10 text-sky-400 opacity-20 float-animation" size={80} />
        <Receipt className="absolute bottom-20 right-10 text-purple-400 opacity-20 bill-flip-animation" size={80} />
        <DollarSign className="absolute top-40 right-20 text-orange-400 opacity-20 float-animation" size={60} style={{ animationDelay: '1s' }} />
        <Receipt className="absolute bottom-40 left-20 text-sky-400 opacity-20 bill-flip-animation" size={60} style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="glass rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl relative z-10 border border-white/40" data-testid="auth-container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 bg-white/50 p-4 rounded-2xl shadow-inner border border-white/50">
            <img src="/favicon.png" alt="TS-Billing Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Log in to manage your professional invoices
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Mail size={16} /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/80 border-slate-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl transition-all"
              data-testid="email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Lock size={16} /> Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="bg-white/80 border-slate-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl transition-all"
              data-testid="password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-600 hover:to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-sky-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            disabled={loading}
            data-testid="submit-auth-btn"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-gray-400 font-medium">
            Professional Invoice Management System
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes bill-flip {
          0%, 100% { transform: scale(1) rotate(0); }
          50% { transform: scale(1.1) rotate(-5deg); }
        }
        .float-animation { animation: float 6s ease-in-out infinite; }
        .bill-flip-animation { animation: bill-flip 8s ease-in-out infinite; }
      `}} />
    </div>
  );
}