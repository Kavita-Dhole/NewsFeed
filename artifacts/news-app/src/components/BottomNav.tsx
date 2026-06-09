import { Link, useLocation } from "wouter";
import { Home, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "For You" },
    { href: "/discover", icon: Compass, label: "Discover" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent">
      <nav className="flex items-center justify-around max-w-md mx-auto bg-card/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl p-1.5">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-medium",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                {isActive && <span className="text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">{item.label}</span>}
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
