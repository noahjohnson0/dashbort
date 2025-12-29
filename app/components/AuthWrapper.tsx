'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Login from './Login';
import Dashboard from './Dashboard';

export default function AuthWrapper() {
    const [user, loading, error] = useAuthState(auth);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
                <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
                <div className="text-red-600 dark:text-red-400">Error: {error.message}</div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return <Dashboard user={user} />;
}

