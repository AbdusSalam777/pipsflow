import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Plus, BarChart3, Calendar,
  BookOpen, AlertTriangle, Target, User, Settings, LogOut,
  Menu, X, ChevronDown, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    label: 'Trades', icon: TrendingUp, children: [
      { label: 'All Trades', path: '/trades' },
      { label: 'Add Trade', path: '/trades/add' },
    ],
  },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'Journal', icon: BookOpen, path: '/journal' },
  { label: 'Mistake Analysis', icon: AlertTriangle, path: '/mistakes' },
  { label: 'Goals', icon: Target, path: '/goals' },
  { label: 'Profile', icon: User, path: '/profile' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>('Trades');

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const themes: { id: ThemeType; label: string; color: string; border: string }[] = [
    { id: 'obsidian', label: 'Obsidian', color: 'bg-[#2563eb]', border: 'border-[#2563eb]' },
    { id: 'cyberpunk', label: 'Cyberpunk', color: 'bg-[#ec4899]', border: 'border-[#ec4899]' },
    { id: 'emerald', label: 'Emerald', color: 'bg-[#10b981]', border: 'border-[#10b981]' },
  ];

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30"
        >
          <TrendingUp className="h-4 w-4 text-white" />
        </motion.div>
        <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          PipsFlow
        </span>
      </div>

      <nav className="flex-grow space-y-1.5 overflow-y-auto p-4">
        {navItems.map((item, idx) => {
          if (item.children) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-primary/5 hover:text-foreground"
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', expanded === item.label && 'rotate-180')} />
                </button>
                <AnimatePresence initial={false}>
                  {expanded === item.label && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-6 overflow-hidden border-l border-border/50 pl-3 space-y-1"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                            isActive(child.path) 
                              ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-2' 
                              : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                          )}
                        >
                          {child.label === 'Add Trade' ? <Plus className="h-3 w-3" /> : null}
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path!}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive(item.path!) 
                  ? 'bg-primary/15 text-primary font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Switcher and User Profile */}
      <div className="border-t border-border/50 p-4 space-y-4 bg-background/30 backdrop-blur-md">
        {/* Theme Picker */}
        <div className="px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" /> Visual Theme
          </p>
          <div className="flex items-center gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                className={cn(
                  "h-6 w-6 rounded-full cursor-pointer transition-all duration-300 hover:scale-125 border-2",
                  theme === t.id ? `${t.border} scale-110 shadow-md shadow-primary/20` : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <span className={cn("block h-full w-full rounded-full", t.color)} />
              </button>
            ))}
          </div>
        </div>

        {/* User Block */}
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary shadow-sm border border-primary/20">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-none mb-1">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg glass p-2 lg:hidden text-foreground hover:bg-accent transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" 
            onClick={() => setMobileOpen(false)} 
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 border-r border-border/50 glass transition-transform lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </aside>
    </>
  );
}

export function AppLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen flex flex-col">
        <div className="container mx-auto p-4 pt-16 lg:p-8 lg:pt-8 flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}