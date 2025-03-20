'use client'
import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from '@clerk/nextjs'
import { Activity } from 'lucide-react'
import { useTheme } from 'next-themes'
import React from 'react'
import { ThemeToggle } from './ThemeToggle'

const Header = () => {
  const {theme,setTheme} = useTheme()
  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16">
        <div className='flex gap-2'>
          <Activity className='text-blue-600 dark:text-blue-400 h-6 w-6'/>
          <h1 className='text-xl font-semibold'>DPin Uptime</h1>
        </div>
    <div className='flex gap-2'>
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      <ThemeToggle isDark={theme=="dark"} onToggle={()=>setTheme(theme == "dark" ? "light" : "dark")}/>
    </div>
  </header>
  )
}

export default Header