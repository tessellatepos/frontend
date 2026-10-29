import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import {
    COUNTRIES,
    CURRENCIES,
    DEPENDENT_LOCALITY_LABELS,
    LOCALITY_LABELS,
    POSTAL_CODE_LABELS,
    SUBDIVISION_LABELS,
    validateAddress,
    type Address,
    type AddressField,
    type Country,
    type CountryCode,
    type CurrencyCode,
} from "@tessellatepos/sdk";
import { useAuthStore } from "@/stores/auth/useAuthStore.ts";
import { FormField } from "@/components/FormField.tsx";
import { StepError, StepHeading } from "./StepHeading.tsx";
import { commonError, postSetup } from "./api.ts";

const countryCodes = (Object.keys(COUNTRIES) as CountryCode[]).sort((a, b) =>
    COUNTRIES[a].name.localeCompare(COUNTRIES[b].name),
);
const currencyCodes = Object.keys(CURRENCIES) as CurrencyCode[];

function guessCountry(): CountryCode {
    const region = navigator.language.split("-")[1]?.toUpperCase();
    return region && region in COUNTRIES ? (region as CountryCode) : "US";
}

type AddressKey = Exclude<keyof Address, "country">;

/** Maps an sdk AddressField to the Address key(s) it fills. */
function keysFor(field: AddressField): AddressKey[] {
    return field === "address_lines"
        ? ["address_line_1", "address_line_2"]
        : [field];
}

const selectClass =
    "h-9 w-full rounded-md border border-input bg-transparent px-2 text-base md:text-sm";

/** Step 3 (provider "local"): store name, address and currency. */
export function StoreStep() {
    const refresh = useAuthStore((s) => s.refresh);
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [country, setCountry] = useState<CountryCode>(guessCountry);
    const [currency, setCurrency] = useState<CurrencyCode>(
        COUNTRIES[guessCountry()].currency,
    );
    const [values, setValues] = useState<Partial<Record<AddressKey, string>>>(
        {},
    );
    const [nameError, setNameError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<AddressField, string>>
    >({});
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const meta: Country = COUNTRIES[country];
    // name/organization are the recipient, not the store: only ask when needed.
    const fields = meta.fields.filter(
        (f) =>
            (f !== "name" && f !== "organization") || meta.required.includes(f),
    );

    function changeCountry(next: CountryCode) {
        setCountry(next);
        setCurrency(COUNTRIES[next].currency);
        setValues({});
        setFieldErrors({});
    }

    function label(field: AddressField): string {
        switch (field) {
            case "name":
                return "Contact name";
            case "organization":
                return "Organization";
            case "address_lines":
                return "Address";
            case "dependent_locality":
                return meta.dependentLocalityType
                    ? DEPENDENT_LOCALITY_LABELS[meta.dependentLocalityType]
                    : "Neighborhood";
            case "locality":
                return meta.localityType
                    ? LOCALITY_LABELS[meta.localityType]
                    : "City";
            case "subdivision":
                return meta.subdivisionType
                    ? SUBDIVISION_LABELS[meta.subdivisionType]
                    : "Region";
            case "postal_code":
                return meta.postalCodeType
                    ? POSTAL_CODE_LABELS[meta.postalCodeType]
                    : "Postal code";
            case "sorting_code":
                return "Sorting code";
        }
    }

    function buildAddress(): Address {
        const address: Address = { country, address_line_1: "" };
        for (const [key, value] of Object.entries(values)) {
            const trimmed = value?.trim();
            if (trimmed)
                (address as unknown as Record<string, string>)[key] = trimmed;
        }
        address.address_line_1 ??= "";
        return address;
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        const errors: Partial<Record<AddressField, string>> = {};
        for (const { field, reason } of validateAddress(buildAddress())) {
            errors[field] =
                reason === "required"
                    ? `${label(field)} is required.`
                    : `${label(field)} is not valid for ${meta.name}.`;
        }
        const missingName = !name.trim();
        setNameError(missingName ? "Store name is required." : "");
        setFieldErrors(errors);
        if (missingName || Object.keys(errors).length) {
            setError("Fix the highlighted fields.");
            return;
        }
        setBusy(true);
        setError("");
        const result = await postSetup("store", {
            name: name.trim(),
            address: buildAddress(),
            currency,
        });
        if (result.ok || result.data.code === "STORE_EXISTS") {
            // Already done: the refreshed status advances the wizard.
            await refresh();
        } else if (result.status === 409) {
            await refresh();
            if (result.data.code === "PROVIDER_SQUARE")
                setError("This store is managed through Square.");
            else void navigate("/", { replace: true });
        } else {
            setError(commonError(result));
        }
        setBusy(false);
    }

    const input = (key: AddressKey, field: AddressField, extra = {}) => (
        <FormField
            key={key}
            label={key === "address_line_2" ? "Address line 2" : label(field)}
            value={values[key] ?? ""}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            error={key === "address_line_2" ? undefined : fieldErrors[field]}
            required={meta.required.includes(field) && key !== "address_line_2"}
            {...extra}
        />
    );

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(e) => void submit(e)}
            noValidate>
            <StepHeading>Your store</StepHeading>
            <FormField
                label="Store name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={nameError}
                autoComplete="organization"
                required
            />
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="setup-country"
                    className="text-sm font-medium">
                    Country
                </label>
                <select
                    id="setup-country"
                    className={selectClass}
                    value={country}
                    onChange={(e) =>
                        changeCountry(e.target.value as CountryCode)
                    }>
                    {countryCodes.map((code) => (
                        <option
                            key={code}
                            value={code}>
                            {COUNTRIES[code].name}
                        </option>
                    ))}
                </select>
            </div>
            {fields.flatMap((field) => {
                if (field === "subdivision" && meta.subdivisions) {
                    const id = `setup-${field}`;
                    return [
                        <div
                            key={field}
                            className="flex flex-col gap-1">
                            <label
                                htmlFor={id}
                                className="text-sm font-medium">
                                {label(field)}
                            </label>
                            <select
                                id={id}
                                className={selectClass}
                                value={values.subdivision ?? ""}
                                aria-invalid={
                                    fieldErrors.subdivision ? true : undefined
                                }
                                aria-describedby={
                                    fieldErrors.subdivision
                                        ? `${id}-error`
                                        : undefined
                                }
                                onChange={(e) =>
                                    setValues({
                                        ...values,
                                        subdivision: e.target.value,
                                    })
                                }>
                                <option value="">Select…</option>
                                {Object.entries(meta.subdivisions).map(
                                    ([code, subName]) => (
                                        <option
                                            key={code}
                                            value={code}>
                                            {subName}
                                        </option>
                                    ),
                                )}
                            </select>
                            {fieldErrors.subdivision && (
                                <p
                                    id={`${id}-error`}
                                    className="text-sm text-red-600">
                                    {fieldErrors.subdivision}
                                </p>
                            )}
                        </div>,
                    ];
                }
                return keysFor(field).map((key) => input(key, field));
            })}
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="setup-currency"
                    className="text-sm font-medium">
                    Currency
                </label>
                <select
                    id="setup-currency"
                    className={selectClass}
                    value={currency}
                    onChange={(e) =>
                        setCurrency(e.target.value as CurrencyCode)
                    }>
                    {currencyCodes.map((code) => (
                        <option
                            key={code}
                            value={code}>
                            {code} - {CURRENCIES[code]}
                        </option>
                    ))}
                </select>
            </div>
            {error && <StepError>{error}</StepError>}
            <button
                type="submit"
                disabled={busy}
                className="self-start rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
                {busy ? "Saving…" : "Save store"}
            </button>
        </form>
    );
}
