import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, User } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LANGUAGES } from "@/lib/i18n-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [language, setLanguage] = useState(user?.language ?? "en-US");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);

  const preview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : (user?.avatarURL ?? null)),
    [avatar, user?.avatarURL],
  );
  useEffect(() => () => {
    if (avatar && preview) URL.revokeObjectURL(preview);
  }, [avatar, preview]);

  const save = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("first_name", firstName.trim());
      form.append("last_name", lastName.trim());
      form.append("language", language);
      if (avatar) form.append("avatar", avatar);
      return api.updateProfile(form);
    },
    onSuccess: (updated) => {
      updateUser(updated);
      setAvatar(null);
      setSaved(true);
    },
  });

  const canSave = Boolean(firstName.trim() && lastName.trim() && !save.isPending);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (canSave) save.mutate();
  }

  return (
    <div className="container max-w-xl py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
                {preview ? (
                  <img src={preview} alt="" className="size-full object-cover" />
                ) : (
                  <User className="size-8" />
                )}
              </span>
              <div className="space-y-1">
                <label htmlFor="avatar" className="text-sm font-medium">
                  Profile picture <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="first-name" className="text-sm font-medium">First name</label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="last-name" className="text-sm font-medium">Last name</label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium">Preferred language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.locale}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {save.isError && (
              <p className="text-sm text-destructive">Could not save your changes. Please try again.</p>
            )}
            {saved && !save.isPending && (
              <p className="text-sm text-emerald-600">Saved.</p>
            )}

            <Button type="submit" disabled={!canSave}>
              <Upload /> {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
