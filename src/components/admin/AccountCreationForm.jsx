import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeyRound, RefreshCw, Loader2, Copy, Check, User, Mail, Phone, Shield, Store as StoreIcon } from "lucide-react";

const generateUsername = (name, type) => {
  const clean = (name || "user").toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 8);
  const num = Math.floor(Math.random() * 900 + 100);
  return `${type === "rider" ? "rider" : "merchant"}_${clean}${num}`;
};

const generatePassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const all = upper + lower + digits + special;
  let pwd = [upper, lower, digits, special].map((s) => s[Math.floor(Math.random() * s.length)]);
  for (let i = 0; i < 8; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  return pwd.sort(() => Math.random() - 0.5).join("");
};

export default function AccountCreationForm({ app, stores, onClose, onCreated }) {
  const { toast } = useToast();
  const [username, setUsername] = useState(app.temporary_username || generateUsername(app.owner_name, app.applicant_type));
  const [password, setPassword] = useState(app.temporary_password || generatePassword());
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState("");
  const [merchantCode, setMerchantCode] = useState("");
  const [riderCode, setRiderCode] = useState("");
  const isMerchant = app.applicant_type === "merchant";

  const handleCreate = async () => {
    setCreating(true);
    try {
      let storeId = selectedStoreId;
      if (isMerchant && !storeId) {
        const newStore = await base44.entities.Store.create({
          name: app.business_name, category: app.store_category || "restaurant",
          description: `Owned by ${app.owner_name}`, address: app.business_address,
          phone: app.phone_number, image_url: app.logo_url || "", logo_url: app.logo_url || "",
          cover_url: app.banner_url || "", is_open: false, is_verified: true,
        });
        storeId = newStore.id;
      }

      let mCode = "";
      let rCode = "";
      if (isMerchant) {
        const existingApps = await base44.entities.MerchantApplication.filter({ applicant_type: "merchant" }, "-created_date", 200).catch(() => []);
        let maxNum = 0;
        for (const a of existingApps) {
          const match = (a.merchant_code || "").match(/DDM0*(\d+)/);
          if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
        }
        mCode = `DDM${String(maxNum + 1).padStart(6, "0")}`;
        setMerchantCode(mCode);
      } else {
        const existingApps = await base44.entities.MerchantApplication.filter({ applicant_type: "rider" }, "-created_date", 200).catch(() => []);
        let maxNum = 0;
        for (const a of existingApps) {
          const match = (a.rider_code || "").match(/DDR0*(\d+)/);
          if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
        }
        rCode = `DDR${String(maxNum + 1).padStart(6, "0")}`;
        setRiderCode(rCode);
      }

      if (!isMerchant) {
        const usersList = await base44.entities.User.filter({ email: app.email }).catch(() => []);
        const userId = usersList.length > 0 ? usersList[0].id : "";
        await base44.entities.Rider.create({
          name: app.owner_name, phone: app.phone_number, rider_code: rCode, user_id: userId,
          vehicle_type: app.vehicle_type || "motorcycle", status: "available",
          rating: 4.8, total_deliveries: 0, total_earnings: 0, is_suspended: false,
        });
      }

      const users = await base44.entities.User.filter({ email: app.email }).catch(() => []);
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, { role: app.applicant_type, ...(storeId && { store_id: storeId }) });
      } else {
        try { await base44.users.inviteUser(app.email, app.applicant_type); }
        catch {
          await base44.users.inviteUser(app.email, "user");
          const invitedUser = await base44.entities.User.filter({ email: app.email }).catch(() => []);
          if (invitedUser.length > 0) {
            await base44.entities.User.update(invitedUser[0].id, { role: app.applicant_type, ...(storeId && { store_id: storeId }) });
          }
        }
      }

      await base44.entities.MerchantApplication.update(app.id, {
        status: "account_created", temporary_username: username, temporary_password: password,
        assigned_store_id: storeId || "", merchant_code: mCode, rider_code: rCode,
      });

      await base44.integrations.Core.SendEmail({
        to: app.email,
        subject: `Welcome to Dhangadhi Dash - Your ${isMerchant ? "Merchant" : "Rider"} Account`,
        body: `Hello ${app.owner_name},\n\nYour ${isMerchant ? "merchant" : "rider"} account has been created on Dhangadhi Dash.\n\nLogin Email: ${app.email}\nUsername: ${username}\nTemporary Password: ${password}\n\nPlease log in and change your password immediately.\n\n${isMerchant ? "You can now manage your store, products, and orders." : "You can now accept delivery requests and start earning."}\n\nThank you for joining Dhangadhi Dash!`,
      });

      await base44.entities.AuditLog.create({
        action: "account_created", target_type: app.applicant_type, target_name: app.business_name,
        details: `Account created for ${app.email} with role ${app.applicant_type}`,
      });

      setCreated(true);
      toast({ title: "Account created successfully!" });
      onCreated();
    } catch (err) { toast({ title: err.message || "Failed to create account", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-saffron" /> Create {isMerchant ? "Merchant" : "Rider"} Account</DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="bg-terai/10 rounded-2xl p-4 text-center">
              <Check className="w-10 h-10 text-terai mx-auto mb-2" />
              <p className="font-bold text-sm text-terai">Account Created Successfully!</p>
            </div>
            {merchantCode && (
              <div className="bg-saffron/10 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-foreground/40 uppercase mb-1">Merchant Code</p>
                <p className="text-xl font-mono font-extrabold text-saffron">{merchantCode}</p>
              </div>
            )}
            {riderCode && (
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-foreground/40 uppercase mb-1">Rider Code</p>
                <p className="text-xl font-mono font-extrabold text-blue-500">{riderCode}</p>
              </div>
            )}
            <div className="bg-muted rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-foreground/40 uppercase">Login Credentials</p>
              {[
                { label: "Email", value: app.email, key: "email" },
                { label: "Username", value: username, key: "user" },
                { label: "Password", value: password, key: "pass" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground"><span className="text-foreground/50">{item.label}:</span> <span className="font-mono">{item.value}</span></span>
                  <button onClick={() => copyToClipboard(item.value, item.key)} className="text-saffron hover:text-saffron/70">{copied === item.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/40">An email with these credentials has been sent. The user must change their password on first login.</p>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-foreground/40" /> {app.owner_name}</div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-foreground/40" /> {app.email}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-foreground/40" /> {app.phone_number}</div>
              <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-foreground/40" /> Role: {app.applicant_type}</div>
            </div>

            {isMerchant && (
              <div>
                <Label>Assign Store</Label>
                <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm">
                  <option value="">Create new: "{app.business_name}"</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <Label>Username</Label>
              <div className="flex gap-2">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={() => setUsername(generateUsername(app.owner_name, app.applicant_type))}><RefreshCw className="w-4 h-4" /></Button>
              </div>
            </div>

            <div>
              <Label>Temporary Password</Label>
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())}><RefreshCw className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-foreground/40 mt-1">User must change this on first login.</p>
            </div>

            <Button onClick={handleCreate} disabled={creating} className="w-full bg-saffron hover:bg-saffron/90">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {creating ? "Creating..." : "Save & Create Account"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}