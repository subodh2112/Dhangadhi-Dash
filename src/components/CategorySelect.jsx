import React, { useState, useEffect, useMemo } from "react";
import { useCategories } from "@/hooks/useCategories";

/**
 * Hierarchical category selector: pick a parent category, then a child category.
 * Props:
 *   parentCategoryId, childCategoryId — controlled values (entity IDs)
 *   onParentChange, onChildChange — callbacks receiving the category ID
 *   showImageUpload — currently unused but reserved for future
 */
export default function CategorySelect({
  parentCategoryId,
  childCategoryId,
  onParentChange,
  onChildChange,
  labelClass = "text-xs font-bold text-foreground/60 uppercase tracking-wide mb-1.5 block",
  inputClass = "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron",
  compact = false,
}) {
  const { parents, childrenByParent, loading } = useCategories();
  const [localParent, setLocalParent] = useState(parentCategoryId || "");
  const [localChild, setLocalChild] = useState(childCategoryId || "");

  useEffect(() => { setLocalParent(parentCategoryId || ""); }, [parentCategoryId]);
  useEffect(() => { setLocalChild(childCategoryId || ""); }, [childCategoryId]);

  const availableChildren = useMemo(
    () => (localParent ? (childrenByParent[localParent] || []) : []),
    [localParent, childrenByParent]
  );

  const handleParentChange = (val) => {
    setLocalParent(val);
    setLocalChild("");
    onParentChange?.(val || null);
    onChildChange?.(null);
  };

  const handleChildChange = (val) => {
    setLocalChild(val);
    onChildChange?.(val || null);
  };

  const h = compact ? "h-10" : "h-11";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClass}>Parent Category</label>
        <select
          className={inputClass + " " + h}
          value={localParent}
          onChange={(e) => handleParentChange(e.target.value)}
          disabled={loading}
        >
          <option value="">{loading ? "Loading..." : "Select parent..."}</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>{p.icon ? p.icon + " " : ""}{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Child Category</label>
        <select
          className={inputClass + " " + h}
          value={localChild}
          onChange={(e) => handleChildChange(e.target.value)}
          disabled={!localParent || availableChildren.length === 0}
        >
          <option value="">{localParent ? "Select child..." : "Pick parent first"}</option>
          {availableChildren.map((c) => (
            <option key={c.id} value={c.id}>{c.icon ? c.icon + " " : ""}{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}