'use client';

import { useState, useEffect, useRef } from 'react';
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
import { LogOut, Settings, Moon, Sun, KeyRound, Tv } from 'lucide-react';
import { EmailAuthProvider, linkWithCredential, updatePassword, type User } from 'firebase/auth';
import { useThemePreference, useSaveThemePreference, useTvModePreference, useSaveTvModePreference } from '@/lib/firebase';
import { BortConfigurationModal } from './BortConfigurationModal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface HeaderProps {
    user: User;
    filledSpaces: number;
    availableSpaces: number;
    totalSpaces: number;
}

export default function Header({ user, filledSpaces, availableSpaces, totalSpaces }: HeaderProps) {
    const [signOut, , signOutError] = useSignOut(auth);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const hasPasswordProvider = user.providerData.some((p) => p.providerId === 'password');

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }
        if (!user.email) {
            setPasswordError('Your account has no email address.');
            return;
        }

        setPasswordSaving(true);
        try {
            if (hasPasswordProvider) {
                await updatePassword(user, newPassword);
            } else {
                const credential = EmailAuthProvider.credential(user.email, newPassword);
                await linkWithCredential(user, credential);
            }
            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const authErr = err as { code?: string; message?: string };
            if (authErr.code === 'auth/requires-recent-login') {
                setPasswordError('Please sign out and sign back in with Google, then try again.');
            } else {
                setPasswordError(authErr.message || 'Failed to set password.');
            }
        } finally {
            setPasswordSaving(false);
        }
    };
    const [themePreference, themeLoading] = useThemePreference(user.uid);
    const [saveTheme] = useSaveThemePreference(user.uid);
    const [tvModePreference, tvModeLoading] = useTvModePreference(user.uid);
    const [saveTvMode] = useSaveTvModePreference(user.uid);
    const hasInitialized = useRef(false);

    const tvModeEnabled = tvModePreference?.enabled ?? false;

    useEffect(() => {
        if (tvModeLoading) return;
        if (tvModeEnabled) {
            document.documentElement.classList.add('tv-mode');
        } else {
            document.documentElement.classList.remove('tv-mode');
        }
    }, [tvModeEnabled, tvModeLoading]);

    const toggleTvMode = async () => {
        const next = !tvModeEnabled;
        if (next) {
            document.documentElement.classList.add('tv-mode');
        } else {
            document.documentElement.classList.remove('tv-mode');
        }
        try {
            await saveTvMode(next);
        } catch (err) {
            console.error('Failed to save TV mode preference:', err);
            if (next) {
                document.documentElement.classList.remove('tv-mode');
            } else {
                document.documentElement.classList.add('tv-mode');
            }
        }
    };

    // Determine theme: Firebase preference, or system preference
    const prefersDark = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    const isDark = themePreference?.theme === 'dark' || (!themePreference && prefersDark);

    // Initialize theme from Firebase or system preference
    useEffect(() => {
        if (themeLoading) return;

        const currentIsDark = themePreference?.theme === 'dark' || (!themePreference && prefersDark);
        
        if (currentIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        if (!hasInitialized.current) {
            hasInitialized.current = true;
        }
    }, [themePreference, themeLoading, prefersDark]);

    const toggleTheme = async () => {
        const newTheme = isDark ? 'light' : 'dark';
        
        // Update DOM immediately for responsive UI
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Save to Firebase
        try {
            await saveTheme(newTheme);
        } catch (err) {
            console.error('Failed to save theme preference:', err);
            // Revert on error
            if (newTheme === 'dark') {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }
        }
    };

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
                            onClick={toggleTheme}
                            className="cursor-pointer"
                        >
                            {isDark ? (
                                <>
                                    <Sun className="mr-2 h-4 w-4" />
                                    <span>Light mode</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="mr-2 h-4 w-4" />
                                    <span>Dark mode</span>
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={toggleTvMode}
                            className="cursor-pointer"
                        >
                            <Tv className="mr-2 h-4 w-4" />
                            <span>{tvModeEnabled ? 'Exit TV mode' : 'TV mode'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                setPasswordError('');
                                setPasswordSuccess(false);
                                setNewPassword('');
                                setConfirmPassword('');
                                setPasswordDialogOpen(true);
                            }}
                            className="cursor-pointer"
                        >
                            <KeyRound className="mr-2 h-4 w-4" />
                            <span>{hasPasswordProvider ? 'Change password' : 'Set password'}</span>
                        </DropdownMenuItem>
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
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {hasPasswordProvider ? 'Change password' : 'Set a password'}
                        </DialogTitle>
                        <DialogDescription>
                            {hasPasswordProvider
                                ? 'Update the password for your account.'
                                : `Add a password to ${user.email} so you can sign in with email and password (e.g. on a work computer) without using Google.`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSetPassword} className="space-y-4">
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                New password
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Confirm password
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                        {passwordError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Password saved. You can now sign in with {user.email} and your new password.
                                </p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setPasswordDialogOpen(false)}
                            >
                                Close
                            </Button>
                            <Button type="submit" disabled={passwordSaving}>
                                {passwordSaving ? 'Saving...' : 'Save password'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </header>
    );
}

