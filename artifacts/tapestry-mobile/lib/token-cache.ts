import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type TokenCache = {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void;
};

const createTokenCache = (): TokenCache => ({
  getToken: async (key: string) => {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("token cache get error:", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  saveToken: (key: string, token: string) => SecureStore.setItemAsync(key, token),
});

export const tokenCache = Platform.OS !== "web" ? createTokenCache() : undefined;
