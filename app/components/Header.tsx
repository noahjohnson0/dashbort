'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSignOut } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings } from 'lucide-react';
import type { User } from 'firebase/auth';
import { ThemeToggle } from './ThemeToggle';
import { BortConfigurationModal } from './BortConfigurationModal';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    user: User;
    filledSpaces: number;
    availableSpaces: number;
    totalSpaces: number;
}

export default function Header({ user, filledSpaces, availableSpaces, totalSpaces }: HeaderProps) {
    const [signOut, , signOutError] = useSignOut(auth);
    const [configModalOpen, setConfigModalOpen] = useState(false);

    return (
        <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-[2em] flex items-center">
                    <Image
                        src="/bort-logo.png"
                        alt="Dashbort Logo"
                        width={52}
                        height={52}
                        className="object-contain h-full w-auto"
                    />
                </div>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 font-outfit">
                    Dash<span className="text-blue-600 dark:text-blue-400">bort</span>
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{filledSpaces}</span> filled
                    </span>
                    <span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{availableSpaces}</span> available
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600">
                        ({totalSpaces} total)
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfigModalOpen(true)}
                        aria-label="Bort Configuration"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.photoURL || undefined} alt={user.email || undefined} />
                                <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={async () => {
                                const success = await signOut();
                                if (!success && signOutError) {
                                    console.error('Sign out error:', signOutError);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <BortConfigurationModal 
                user={user} 
                open={configModalOpen} 
                onOpenChange={setConfigModalOpen} 
            />
        </header>
    );
}

