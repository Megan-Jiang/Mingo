import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Users, Calendar, Gift, User } from "lucide-react";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: Home, label: "记录" },
    { path: "/people", icon: Users, label: "朋友" },
    { path: "/calendar", icon: Calendar, label: "日历" },
    { path: "/blessing", icon: Gift, label: "祝福" },
    { path: "/profile", icon: User, label: "我的" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 pb-6 shadow-lg shadow-warm-purple/5">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "text-warm-purple bg-warm-purple/10"
                  : "text-gray-400 hover:text-warm-purple"
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive ? "bg-warm-purple/10" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
