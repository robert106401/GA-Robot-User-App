import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizePersistedAppState, PersistedAppState } from "./appState";

const STORAGE_KEY = "ga-user-app:state:v1";

export async function loadPersistedAppState(): Promise<PersistedAppState | null> {
  try {
    const serialized = await AsyncStorage.getItem(STORAGE_KEY);
    return serialized ? normalizePersistedAppState(JSON.parse(serialized)) : null;
  } catch {
    return null;
  }
}

export async function savePersistedAppState(state: PersistedAppState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full storage failure should not make checkout or navigation unusable.
  }
}
