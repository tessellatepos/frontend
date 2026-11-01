import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { customerLabel, deliveryNeed, shortReference } from "./format.ts";

describe("customerLabel", () => {
    it("prefers the name, then company, then email, then id", () => {
        assert.equal(
            customerLabel({ id: "c1", given_name: "Ada", family_name: "L" }),
            "Ada L",
        );
        assert.equal(
            customerLabel({ id: "c1", company_name: "Acme", email: "a@b.c" }),
            "Acme",
        );
        assert.equal(customerLabel({ id: "c1", email: "a@b.c" }), "a@b.c");
        assert.equal(customerLabel({ id: "c1" }), "c1");
    });
});

describe("deliveryNeed", () => {
    it("names what each method needs", () => {
        assert.equal(deliveryNeed("EMAIL"), "an email address");
        assert.equal(deliveryNeed("SMS"), "a phone number");
        assert.equal(deliveryNeed("SHARE_MANUALLY"), "");
    });
});

describe("shortReference", () => {
    it("shortens only long references", () => {
        assert.equal(shortReference("abc"), "abc");
        assert.equal(shortReference("0123456789abcdef"), "01234567…");
    });
});
