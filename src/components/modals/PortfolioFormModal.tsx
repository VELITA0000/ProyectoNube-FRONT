import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderPlus, X } from "lucide-react";
import { portfolioService } from "@/services/portfolioService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Portfolio, User } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Photographer's existing client roster, used as the picker source. */
  availableClients: User[];
  onCreated?: (p: Portfolio) => void;
}

export function PortfolioFormModal({ open, onOpenChange, availableClients, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setSelectedClientIds([]);
      setExtraEmails([]);
      setEmailDraft("");
    }
  }, [open]);

  const sortedClients = useMemo(
    () => [...availableClients].sort((a, b) => a.name.localeCompare(b.name)),
    [availableClients],
  );

  const toggleClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addEmail = () => {
    const e = emailDraft.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    if (
      extraEmails.includes(e) ||
      sortedClients.some((c) => c.email.toLowerCase() === e && selectedClientIds.includes(c.id))
    ) {
      setEmailDraft("");
      return;
    }
    setExtraEmails((prev) => [...prev, e]);
    setEmailDraft("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const created = await portfolioService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        clientIds: selectedClientIds.length ? selectedClientIds : undefined,
        clientEmails: extraEmails.length ? extraEmails : undefined,
      });
      toast({ title: "Portfolio created", description: created.title });
      if (created.unknownEmails && created.unknownEmails.length > 0) {
        toast({
          title: "Some emails were ignored",
          description: `${created.unknownEmails.join(
            ", ",
          )} are not registered as clients yet. Ask them to sign up and re-add them from the portfolio detail.`,
          variant: "destructive",
        });
      }
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Could not create",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg border border-border max-w-lg bg-card">
        <DialogHeader>
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
            <FolderPlus className="w-3 h-3" /> New
          </div>
          <DialogTitle className="font-serif text-2xl">Create portfolio</DialogTitle>
          <DialogDescription>
            Optionally associate clients now; you can also do it later from the portfolio detail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="p-title">Title *</Label>
              <Input
                id="p-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Maria & John wedding"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note…"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Associated clients (optional)</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Pick from your client list, and/or add by email.
              </p>

              {sortedClients.length === 0 ? (
                <p className="text-xs text-muted-foreground border border-dashed border-border rounded p-3">
                  You don't have clients yet. Add some from the <b>Clients</b> page, or add them
                  here by email.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {sortedClients.map((c) => {
                    const active = selectedClientIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClient(c.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/40"
                        }`}
                        title={c.email}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmail();
                      }
                    }}
                    placeholder="extra-client@example.com"
                  />
                  <Button type="button" variant="outline" onClick={addEmail}>
                    Add
                  </Button>
                </div>
                {extraEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {extraEmails.map((e) => (
                      <span
                        key={e}
                        className="text-xs px-2 py-0.5 rounded-full bg-accent border border-border flex items-center gap-1"
                      >
                        {e}
                        <button
                          type="button"
                          onClick={() => setExtraEmails((prev) => prev.filter((x) => x !== e))}
                          aria-label="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  Emails must belong to existing client accounts. Unmatched emails are skipped
                  and reported back to you.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
