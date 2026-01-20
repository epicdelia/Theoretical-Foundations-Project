'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, BarChart3, Bookmark, User, MapPin, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/results', label: 'Results', icon: BarChart3 },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/settings', label: 'Profile', icon: User },
]

export function DesktopNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Don't show nav on assessment pages, auth pages, or landing page
  const hideNav =
    pathname === '/' ||
    pathname.startsWith('/assessment') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/auth')

  if (hideNav) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-background md:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Urban Destiny</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t p-4">
            <div className="mb-3 truncate text-sm text-muted-foreground">
              {user.email}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
