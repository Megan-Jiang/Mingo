import { HomeIcon, Users, Calendar as CalendarIcon, Gift, User } from "lucide-react";
import Index from "./pages/Index.jsx";
import People from "./pages/People.jsx";
import Calendar from "./pages/Calendar.jsx";
import Blessing from "./pages/Blessing.jsx";
import Profile from "./pages/Profile.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "记录",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "朋友",
    to: "/people",
    icon: <Users className="h-4 w-4" />,
    page: <People />,
  },
  {
    title: "日历",
    to: "/calendar",
    icon: <CalendarIcon className="h-4 w-4" />,
    page: <Calendar />,
  },
  {
    title: "祝福",
    to: "/blessing",
    icon: <Gift className="h-4 w-4" />,
    page: <Blessing />,
  },
  {
    title: "我的",
    to: "/profile",
    icon: <User className="h-4 w-4" />,
    page: <Profile />,
  },
];
