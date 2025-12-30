import { Button } from "@/components/ui/button";
import { BarChart3, Calculator, FileText, LayoutDashboard, LogOut, Receipt, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Layout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();

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
    { path: "/settings", icon: Settings, label: "Settings", testId: "nav-settings" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass-dark min-h-screen p-6 hidden md:block flex flex-col" data-testid="sidebar">
        <div className="flex-1">
          <div className="mb-8 fade-in">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src="/images/logo.png" alt="TS-Billing Logo" className="w-40 h-40 object-contain" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent flex items-center gap-2">
              <Receipt className="text-sky-500" />
              TS-Billing
            </h2>
            {user && (
              <p className="text-sm text-sky-700 mt-1" data-testid="user-business-name">Technosprint Info Solutions</p>
            )}
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full mt-6"
          data-testid="logout-btn"
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </Button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
