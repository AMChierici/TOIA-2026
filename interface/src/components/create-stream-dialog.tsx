import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
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

export function CreateStreamDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pic, setPic] = useState<File | null>(null);

  const create = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("private", String(isPrivate));
      form.append("stream_pic", pic!);
      return api.createStream(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-streams"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setOpen(false);
      setName("");
      setIsPrivate(false);
      setPic(null);
    },
  });

  const nameError = name.trim().toLowerCase() === "all" ? 'Name cannot be "All"' : null;
  const canSubmit = Boolean(name.trim() && pic && !nameError && !create.isPending);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSubmit) create.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> New stream
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a stream</DialogTitle>
          <DialogDescription>
            Streams group your videos into a conversation people can talk to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="stream-name" className="text-sm font-medium">Name</label>
            <Input
              id="stream-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. About my career"
              required
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="stream-pic" className="text-sm font-medium">Cover photo</label>
            <Input
              id="stream-pic"
              type="file"
              accept="image/*"
              onChange={(e) => setPic(e.target.files?.[0] ?? null)}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="size-4 rounded border-input"
            />
            Private (only you can see this stream)
          </label>

          {create.isError && (
            <p className="text-sm text-destructive">Could not create the stream. Please try again.</p>
          )}

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {create.isPending ? "Creating…" : "Create stream"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
