import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    changedConfig,
    configFields,
    defaultDueDate,
    invoiceIsOpen,
    statusLabel,
} from "./format.ts";

describe("changedConfig", () => {
    it("keeps trimmed typed values and drops untouched fields", () => {
        assert.deepEqual(changedConfig({ a: " key ", b: "", c: "   " }), {
            a: "key",
        });
    });
});

describe("configFields", () => {
    it("knows Square and falls back to the stored key names", () => {
        assert.deepEqual(
            configFields("square", []).map((f) => f.key),
            ["webhookSignatureKey", "squareLocationId"],
        );
        assert.deepEqual(
            configFields("other", ["apiKey"]).map((f) => f.label),
            ["apiKey"],
        );
    });
});

describe("statusLabel", () => {
    it("labels known and unknown statuses", () => {
        assert.equal(statusLabel("processing"), "Processing");
        assert.equal(statusLabel("overdue"), "Overdue");
    });
});

describe("defaultDueDate", () => {
    it("adds days across a month end", () => {
        assert.equal(
            defaultDueDate(new Date(2026, 0, 25, 15), 14),
            "2026-02-08",
        );
    });
});

describe("invoiceIsOpen", () => {
    it("is false once paid, canceled or refunded", () => {
        assert.equal(invoiceIsOpen("sent"), true);
        assert.equal(invoiceIsOpen("paid"), false);
        assert.equal(invoiceIsOpen("canceled"), false);
    });
});
