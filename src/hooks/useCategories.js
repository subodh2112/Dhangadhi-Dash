import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache: all components sharing this hook get the same data
// without redundant API calls.
let _cache = null;
let _fetching = false;
let _listeners = new Set();

function notify(data, loading) {
  _listeners.forEach((fn) => fn(data, loading));
}

export function useCategories() {
  const [categories, setCategories] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  const fetchCategories = useCallback(async () => {
    if (_fetching) return;
    _fetching = true;
    notify(_cache || [], true);
    try {
      const data = await base44.entities.Category.list("display_order", 500);
      _cache = data;
      setCategories(data);
      notify(data, false);
    } catch {
      setCategories([]);
      notify([], false);
    } finally {
      _fetching = false;
    }
  }, []);

  useEffect(() => {
    if (_cache) {
      setCategories(_cache);
      setLoading(false);
      return;
    }

    const listener = (data, isLoading) => {
      setCategories(data);
      setLoading(isLoading);
    };
    _listeners.add(listener);

    if (!_fetching) {
      fetchCategories();
    }

    return () => { _listeners.delete(listener); };
  }, [fetchCategories]);

  const parents = categories.filter((c) => !c.parent_category_id);
  const children = categories.filter((c) => c.parent_category_id);

  const childrenByParent = {};
  children.forEach((c) => {
    if (!childrenByParent[c.parent_category_id]) childrenByParent[c.parent_category_id] = [];
    childrenByParent[c.parent_category_id].push(c);
  });

  const activeParents = parents.filter((c) => c.is_active !== false);

  // Helper: resolve a category ID to its record
  const categoryMap = {};
  categories.forEach((c) => { categoryMap[c.id] = c; });

  // Helper: get parent + child names for a product
  const resolvePath = (parentId, childId) => {
    const parent = parentId ? categoryMap[parentId] : null;
    const child = childId ? categoryMap[childId] : null;
    return {
      parentName: parent?.name || "",
      childName: child?.name || "",
      parentIcon: parent?.icon || "",
      childIcon: child?.icon || "",
      parentSlug: parent?.slug || "",
      childSlug: child?.slug || "",
    };
  };

  return { categories, parents, children, childrenByParent, activeParents, categoryMap, resolvePath, loading, refetch: fetchCategories };
}