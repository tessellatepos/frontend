import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { credentialStatus, lines } from "./format.ts";

describe("lines", () => {
    it("trims and drops blanks", () => {
        assert.deepEqual(lines(" https://a.test \n\n  \nhttps://b.test"), [
            "https://a.test",
            "https://b.test",
        ]);
        assert.deepEqual(lines(""), []);
    });
});

describe("credentialStatus", () => {
    const now = Date.parse("2026-10-31T00:00:00Z");
    it("is revoked before anything else", () => {
        assert.equal(
            credentialStatus(
                { revoked_at: "2026-10-01T00:00:00Z", expires_at: null },
                now,
            ),
            "Revoked",
        );
    });
    it("is expired once the expiry has passed", () => {
        assert.equal(
            credentialStatus({ expires_at: "2026-10-30T00:00:00Z" }, now),
            "Expired",
        );
        assert.equal(
            credentialStatus({ expires_at: "2026-11-30T00:00:00Z" }, now),
            "Active",
        );
        assert.equal(credentialStatus({ expires_at: null }, now), "Active");
    });
});
