import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { History, Home, LogIn, LogOut, Settings, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    showSuccess("Logged out successfully");
    navigate("/login");
  };

  return (
    <nav className="border-b bg-white dark:bg-gray-950 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          <span className="text-blue-600">PDF</span>Extractor
        </Link>
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/history">
              <Button
                variant={location.pathname === "/history" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </Link>
            <Link to="/settings">
              <Button
                variant={location.pathname === "/settings" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Register
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;