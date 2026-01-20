'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { MobileNav } from './mobile-nav'
import { DesktopNav } from './desktop-nav'
import { PageTransition } from './page-transition'
import { cn } from '@/lib/utils'

interface NavigationLayoutProps {
  children: ReactNode
}

export function NavigationLayout({ children }: NavigationLayoutProps) {
  const pathname = usePathname()

  // Pages where navigation should not be shown
  const hideNav =
    pathname === '/' ||
    pathname.startsWith('/assessment') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/auth')

  return (
    <>
      <DesktopNav />
      <main
        className={cn(
          'flex-1',
          !hideNav && 'pb-16 md:pb-0 md:pl-64'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      <MobileNav />
    </>
  )
}
