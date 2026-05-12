import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { photographerService } from "@/services/photographerService";
import type { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Trash2 } from "lucide-react";

export default function PhotographerClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const list = await photographerService.listClients(user.id);
    setClients(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await photographerService.addClient(trimmed);
      toast({ title: "Client added", description: trimmed });
      setEmail("");
      setOpen(false);
      await load();
    } catch (err) {
      toast({
        title: "Could not add client",
        description:
          err instanceof Error
            ? err.message
            : "Make sure they signed up as a client with that email.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (c: User) => {
    if (!window.confirm(`Remove ${c.name} from your clients?`)) return;
    try {
      await photographerService.removeClient(c.id);
      toast({ title: "Client removed" });
      await load();
    } catch (err) {
      toast({
        title: "Could not remove",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the clients you can later associate with portfolios
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:opacity-90">
          <UserPlus className="w-4 h-4 mr-1" /> Add client
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-6 bg-card">
          No clients yet. Use “Add client” with the email of someone who already signed up
          as a client.
        </p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              className="w-64 border border-border rounded-lg p-4 bg-lumiere-card shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium font-serif truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-2 truncate">{c.email}</div>
                  {c.phone && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">{c.phone}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void remove(c)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Remove client"
                  title="Remove client"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-lg border border-border max-w-md bg-card">
          <DialogHeader>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
              <UserPlus className="w-3 h-3" /> New client
            </div>
            <DialogTitle className="font-serif text-2xl">Add client by email</DialogTitle>
            <DialogDescription>
              The person must already have signed up with the role <b>client</b>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit}>
            <div className="space-y-2 py-2">
              <Label htmlFor="add-client-email">Email *</Label>
              <Input
                id="add-client-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                {submitting ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
