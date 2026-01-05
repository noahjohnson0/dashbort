'use client';

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

interface HeaderProps {
    user: User;
}

export default function Header({ user }: HeaderProps) {
    const [signOut, , signOutError] = useSignOut(auth);

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
            <div className="flex justify-end">
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
                        <DropdownMenuItem className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Bort Configuration</span>
                        </DropdownMenuItem>
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
        </header>
    );
}

