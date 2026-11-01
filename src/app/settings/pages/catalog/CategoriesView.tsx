import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { FormField } from "@/components/FormField.tsx";
import { useCatalogStore } from "@/stores/catalog/useCatalogStore.ts";
import type { CategoryNode } from "@/stores/catalog/api.ts";

interface Row {
    node: CategoryNode;
    depth: number;
}

function flatten(nodes: CategoryNode[]): Row[] {
    const byParent = new Map<string | null, CategoryNode[]>();
    const ids = new Set(nodes.map((n) => n.id));
    for (const n of nodes) {
        const parent =
            n.parentCategoryId && ids.has(n.parentCategoryId)
                ? n.parentCategoryId
                : null;
        byParent.set(parent, [...(byParent.get(parent) ?? []), n]);
    }
    const rows: Row[] = [];
    const walk = (parent: string | null, depth: number) => {
        const children = [...(byParent.get(parent) ?? [])].sort((a, b) =>
            a.name.localeCompare(b.name),
        );
        for (const node of children) {
            rows.push({ node, depth });
            walk(node.id, depth + 1);
        }
    };
    walk(null, 0);
    return rows;
}

/** Ids of a category and everything below it, which cannot be its parent. */
function descendants(nodes: CategoryNode[], id: string): Set<string> {
    const out = new Set([id]);
    let grew = true;
    while (grew) {
        grew = false;
        for (const n of nodes) {
            if (
                n.parentCategoryId &&
                out.has(n.parentCategoryId) &&
                !out.has(n.id)
            ) {
                out.add(n.id);
                grew = true;
            }
        }
    }
    return out;
}

export default function CategoriesView() {
    const categories = useCatalogStore((s) => s.categories);
    const canManage = useCatalogStore((s) => s.canManage);
    const saveCategory = useCatalogStore((s) => s.saveCategory);
    const removeCategory = useCatalogStore((s) => s.removeCategory);
    // editing: null = closed, "" = new, otherwise the category id.
    const [editing, setEditing] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [parent, setParent] = useState("");
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const formRef = useRef<HTMLFormElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (editing !== null) formRef.current?.querySelector("input")?.focus();
    }, [editing]);
    useEffect(() => {
        if (deleting) confirmRef.current?.querySelector("button")?.focus();
    }, [deleting]);

    const rows = flatten(categories);
    const blocked = editing ? descendants(categories, editing) : new Set();

    const start = (node?: CategoryNode) => {
        setEditing(node?.id ?? "");
        setName(node?.name ?? "");
        setParent(node?.parentCategoryId ?? "");
        setError("");
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Enter a name.");
            return;
        }
        const failure = await saveCategory(editing || null, {
            name: name.trim(),
            parentCategoryId: parent || null,
        });
        if (failure) setError(failure);
        else setEditing(null);
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        const failure = await removeCategory(deleting);
        setDeleting(null);
        setError(failure);
    };

    return (
        <div className="flex flex-col gap-3">
            {canManage && editing === null && (
                <div>
                    <Button onClick={() => start()}>New category</Button>
                </div>
            )}
            {error && editing === null && (
                <p
                    role="alert"
                    className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {editing !== null && (
                <form
                    ref={formRef}
                    onSubmit={(e) => void submit(e)}
                    aria-label={editing ? "Edit category" : "New category"}
                    className="flex max-w-md flex-col gap-3 rounded border p-4">
                    <FormField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={error}
                    />
                    <label className="flex flex-col gap-1 text-sm font-medium">
                        Parent category
                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-2 font-normal"
                            value={parent}
                            onChange={(e) => setParent(e.target.value)}>
                            <option value="">None (top level)</option>
                            {categories
                                .filter((c) => !blocked.has(c.id))
                                .map((c) => (
                                    <option
                                        key={c.id}
                                        value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                    <div className="flex gap-2">
                        <Button type="submit">Save</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">No categories yet.</p>
            ) : (
                <ul aria-label="Categories">
                    {rows.map(({ node, depth }) => (
                        <li
                            key={node.id}
                            style={{ paddingLeft: depth * 24 }}
                            className="flex items-center gap-3 border-b py-2">
                            <span>{node.name}</span>
                            <span className="text-xs text-gray-500">
                                {node.itemCount} items
                            </span>
                            {canManage && (
                                <span className="ml-auto flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        aria-label={`Edit ${node.name}`}
                                        onClick={() => start(node)}>
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        aria-label={`Delete ${node.name}`}
                                        onClick={() => setDeleting(node.id)}>
                                        Delete
                                    </Button>
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {deleting && (
                <div
                    ref={confirmRef}
                    role="alertdialog"
                    aria-label="Confirm delete"
                    className="flex items-center gap-3 rounded border border-red-300 p-3 text-sm">
                    <span>
                        Delete this category? Items stay, but lose this
                        category.
                    </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void confirmDelete()}>
                        Delete
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleting(null)}>
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
}
