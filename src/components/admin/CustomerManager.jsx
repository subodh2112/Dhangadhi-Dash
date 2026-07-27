import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users } from "lucide-react";

export default function CustomerManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.User.list("-created_date", 50)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const customers = users.filter((u) => u.role === "customer" || u.role === "user");

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-saffron" />
        <h2 className="font-display font-bold text-lg text-foreground">Customers ({customers.length})</h2>
      </div>
      {customers.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Users className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-foreground/40">No customers yet.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {customers.map((user, i) => (
            <div key={user.id} className={`flex items-center gap-4 p-4 ${i !== customers.length - 1 ? "border-b border-border" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-saffron/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-saffron">{user.full_name?.[0]?.toUpperCase() || "U"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{user.full_name || "Unknown"}</p>
                <p className="text-xs text-foreground/40 truncate">{user.email}</p>
              </div>
              <span className="text-xs text-foreground/40">{new Date(user.created_date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}