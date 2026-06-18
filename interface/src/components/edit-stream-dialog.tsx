import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { api, type Stream } from "@/lib/api";
import { LANGUAGES } from "@/lib/i18n-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditStreamDialog({ stream }: { stream: Stream }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(stream.name);
  const [visibility, setVisibility] = useState<"public" | "private">(
    stream.private ? "private" : "public",
  );
  const [language, setLanguage] = useState(stream.language ?? "en-US");
  const [bio, setBio] = useState(stream.bio ?? "");

  // Reset the form to the stream's current values whenever the dialog opens.
  function onOpenChange(next: boolean) {
    if (next) {
      setName(stream.name);
      setVisibility(stream.private ? "private" : "public");
      setLanguage(stream.language ?? "en-US");
      setBio(stream.bio ?? "");
    }
    setOpen(next);
  }

  const save = useMutation({
    mutationFn: () =>
      api.updateStream(stream.id_stream, {
        name: name.trim(),
        private: visibility === "private",
        language,
        bio: bio.trim(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-streams"] });
      void queryClient.invalidateQueries({ queryKey: ["streams"] });
      setOpen(false);
    },
  });

  const nameError = name.trim().toLowerCase() === "all" ? 'Name cannot be "All"' : null;
  const canSubmit = Boolean(name.trim() && !nameError && !save.isPending);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSubmit) save.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" title="Stream settings">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stream settings</DialogTitle>
          <DialogDescription>Rename this stream or change who can see it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-stream-name" className="text-sm font-medium">Name</label>
            <Input
              id="edit-stream-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-stream-visibility" className="text-sm font-medium">
              Visibility
            </label>
            <select
              id="edit-stream-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="public">Public — anyone can talk to it</option>
              <option value="private">Private — only you can see it</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-stream-language" className="text-sm font-medium">Language</label>
            <select
              id="edit-stream-language"
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

          <div className="space-y-2">
            <label htmlFor="edit-stream-bio" className="text-sm font-medium">
              Bio <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="edit-stream-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {save.isError && (
            <p className="text-sm text-destructive">Could not save changes. Please try again.</p>
          )}

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
