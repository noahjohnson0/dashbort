'use client';

import { useState, useEffect } from 'react';

export default function DateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const dayName = dateTime.toLocaleDateString('en-US', { weekday: 'long' }) || 'Unknown';
  const date = dateTime.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) || dateTime.toDateString();
  const time = dateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) || dateTime.toTimeString();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col overflow-hidden">
      <div className="flex flex-col gap-2 flex-1 min-h-0 justify-center">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {time}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {dayName}, {date}
          </div>
        </div>
      </div>
    </div>
  );
}

