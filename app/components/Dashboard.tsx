'use client';

import type { User } from 'firebase/auth';
import Header from './Header';
import WorkTimer from './bortlet/WorkTimer';
import RepCounter from './bortlet/RepCounter';
import SunriseSunset from './bortlet/SunriseSunset';
import RecurringDailyActions from './bortlet/RecurringDailyActions';
import DaysUntilPayday from './bortlet/DaysUntilPayday';

interface DashboardProps {
    user: User;
}

export default function Dashboard({ user }: DashboardProps) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <Header user={user} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <WorkTimer />
                    <RepCounter />
                    <SunriseSunset />
                    <RecurringDailyActions />
                    <DaysUntilPayday />
                </div>
            </div>
        </div>
    );
}

