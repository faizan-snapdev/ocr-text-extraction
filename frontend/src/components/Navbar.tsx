import { Button } from "@/components/ui/button";
import { History, Home, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="border-b bg-white dark:bg-gray-950 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          <span className="text-blue-600">PDF</span>Extractor
        </Link>
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
      </div>
    </nav>
  );
};

export default Navbar;