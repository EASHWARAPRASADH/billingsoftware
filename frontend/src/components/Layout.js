import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, Calculator, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Receipt, Settings } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Layout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard", testId: "nav-dashboard" },
    { path: "/invoices", icon: FileText, label: "Invoices", testId: "nav-invoices" },
    { path: "/expenses", icon: Receipt, label: "Expenses", testId: "nav-expenses" },
    { path: "/analytics", icon: BarChart3, label: "Analytics", testId: "nav-analytics" },
    { path: "/tax-reports", icon: Calculator, label: "Tax Reports", testId: "nav-tax-reports" },
    { path: "/payment-status", icon: CreditCard, label: "Payment Status", testId: "nav-payment-status" },
    { path: "/settings", icon: Settings, label: "Settings", testId: "nav-settings" }
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="mb-8 fade-in">
        <div className="flex justify-center mb-4">
          <img src="/favicon.png" alt="TS-Billing Logo" className="w-32 h-32 object-contain" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Receipt className="text-sky-500" />
          TS-Billing
        </h2>
        {user && (
          <p className="text-sm text-sky-700 mt-1 text-center" data-testid="user-business-name">Technosprint Info Solutions</p>
        )}
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              data-testid={item.testId}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive
                ? "bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-lg scale-105"
                : "text-sky-800 hover:bg-white/70 hover:scale-105"
                }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full mt-6"
        data-testid="logout-btn"
      >
        <LogOut size={20} className="mr-2" />
        Logout
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 glass-dark sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Receipt className="text-sky-500" size={24} />
          <span className="font-bold text-lg text-sky-900">TS-Billing</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-6 glass-dark border-r-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle> {/* Accessibility: Screen reader only title */}
            <NavContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-64 glass-dark min-h-screen p-6 hidden md:flex flex-col sticky top-0 h-screen" data-testid="sidebar">
        <NavContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
