import { create } from "zustand";
import {
    type ApiCredential,
    CredentialsApiError,
    listCredentials,
} from "./api.ts";

interface CredentialsState {
    credentials: ApiCredential[];
    loading: boolean;
    error: string;
    /** Replaces the list with what the server has. */
    load: () => Promise<void>;
}

export const useCredentialsStore = create<CredentialsState>((set) => ({
    credentials: [],
    loading: true,
    error: "",
    load: async () => {
        try {
            set({
                credentials: await listCredentials(),
                error: "",
                loading: false,
            });
        } catch (err) {
            set({
                error:
                    err instanceof CredentialsApiError
                        ? err.message
                        : "Could not reach the server. Try again.",
                loading: false,
            });
        }
    },
}));
