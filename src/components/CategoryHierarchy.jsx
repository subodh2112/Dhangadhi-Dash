import React from "react";
import { ChevronRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

/**
 * Displays "Parent → Child" category breadcrumb for a product.
 * Resolves DB IDs to names via the shared category cache.
 */
export default function CategoryHierarchy({
  parentCategoryId,
  childCategoryId,
  className = "",
  showIcons = false,
  linkToParent = false,
}) {
  const { resolvePath } = useCategories();
  const { parentName, childName, parentIcon, childIcon } = resolvePath(parentCategoryId, childCategoryId);

  if (!parentName && !childName) return null;

  return (
    <div className={"flex items-center gap-0.5 text-[10px] text-foreground/40 " + className}>
      {parentName && (
        <span className="flex items-center gap-0.5 truncate">
          {showIcons && parentIcon && <span>{parentIcon}</span>}
          <span className="truncate">{parentName}</span>
        </span>
      )}
      {childName && (
        <span className="flex items-center gap-0.5 truncate">
          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" />
          {showIcons && childIcon && <span>{childIcon}</span>}
          <span className="truncate">{childName}</span>
        </span>
      )}
    </div>
  );
}