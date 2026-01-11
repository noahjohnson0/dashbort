'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRecurringActions, useSaveRecurringActions, type RecurringAction } from '@/lib/firebase/recurringActions';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: RecurringAction[];
  onSave: (actions: RecurringAction[]) => void;
  saving: boolean;
}

function SettingsModal({ isOpen, onClose, actions, onSave, saving }: SettingsModalProps) {
  const [localActions, setLocalActions] = useState<RecurringAction[]>(actions);

  if (!isOpen) return null;

  const handleAddAction = () => {
    const newAction: RecurringAction = {
      id: Date.now().toString(),
      name: '',
      completed: false,
    };
    setLocalActions([...localActions, newAction]);
  };

  const handleRemoveAction = (id: string) => {
    setLocalActions(localActions.filter((action) => action.id !== id));
  };

  const handleUpdateAction = (id: string, name: string) => {
    setLocalActions(
      localActions.map((action) => (action.id === id ? { ...action, name } : action))
    );
  };

  const handleSave = () => {
    // Filter out empty actions
    const validActions = localActions.filter((action) => action.name.trim() !== '');
    onSave(validActions);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Configure Daily Actions
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {localActions.map((action) => (
              <div key={action.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={action.name}
                  onChange={(e) => handleUpdateAction(action.id, e.target.value)}
                  placeholder="Action name..."
                  className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRemoveAction(action.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddAction}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold transition-colors"
            >
              + Add Action
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecurringDailyActions() {
  const [user] = useAuthState(auth);
  const [actions, loading, error] = useRecurringActions(user?.uid || null);
  const [saveActions, saving, saveError] = useSaveRecurringActions(user?.uid || null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleToggleComplete = async (id: string) => {
    if (!user || !actions) return;

    const updatedActions = actions.map((action) =>
      action.id === id ? { ...action, completed: !action.completed } : action
    );

    try {
      await saveActions(updatedActions);
    } catch (err) {
      console.error('Failed to update action:', err);
    }
  };

  const handleSaveSettings = async (newActions: RecurringAction[]) => {
    try {
      await saveActions(newActions);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error('Failed to save actions:', err);
    }
  };


  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 select-none w-full h-full flex flex-col">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 select-none w-full h-full flex flex-col">
        <div className="text-red-600 dark:text-red-400">Error: {error.message}</div>
      </div>
    );
  }

  const actionsList = actions || [];
  const completedCount = actionsList.filter((a) => a.completed).length;
  const totalCount = actionsList.length;

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 select-none w-full h-full flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Recurring Daily Actions
          </h2>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {totalCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Progress: {completedCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {actionsList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              No actions configured. Click the settings icon to add actions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {actionsList.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                onClick={() => handleToggleComplete(action.id)}
              >
                <input
                  type="checkbox"
                  checked={action.completed}
                  onChange={() => handleToggleComplete(action.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span
                  className={`flex-1 ${
                    action.completed
                      ? 'line-through text-zinc-400 dark:text-zinc-500'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {action.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {saveError && (
          <div className="mt-4 text-sm text-red-600 dark:text-red-400">
            Error: {saveError.message}
          </div>
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        actions={actionsList}
        onSave={handleSaveSettings}
        saving={saving}
      />
    </>
  );
}

