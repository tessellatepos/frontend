import type { ProviderId } from "@tessellatepos/sdk";

/** Names shown for each provider, wherever the active one is described. */
export const PROVIDER_LABELS: Record<ProviderId, string> = {
    square: "Square",
    local: "Local (cash only, for testing)",
};
