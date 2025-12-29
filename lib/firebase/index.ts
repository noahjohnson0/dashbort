// Re-export Firebase services for easier imports
export { default as app } from "./config";
export { auth, db, storage, analytics } from "./config";

// Re-export user settings hooks
export { useSaveUserLocation, useUserLocation, type UserLocation } from "./userSettings";
export { useSavePaydaySettings, usePaydaySettings, type PaydaySettings } from "./userSettings";

