import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { portfolioService } from "@/services/portfolioService";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Portfolio } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  portfolio: Portfolio;
  onPublished?: (p: Portfolio) => void;
}

export function PublishPortfolioModal({
  open,
  onOpenChange,
  portfolio,
  onPublished,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await portfolioService.publish(portfolio.id);
      toast({
        title: portfolio.status === "published" ? "Re-published" : "Portfolio published",
        description: `${res.enqueuedPhotos} photo(s) sent to the watermark Lambda. ${res.notificationsSent} notification(s) emitted.`,
      });
      onPublished?.(res.portfolio);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Could not publish",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg border border-border max-w-md bg-card">
        <DialogHeader>
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
            <Send className="w-3 h-3" /> Publish
          </div>
          <DialogTitle className="font-serif text-2xl">
            {portfolio.status === "published" ? "Re-publish portfolio" : "Publish portfolio"}
          </DialogTitle>
          <DialogDescription>
            Clients see watermarked previews. Originals become available after purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div>
            <div className="text-muted-foreground text-xs mb-1">Will be sent to</div>
            {portfolio.clients.length === 0 ? (
              <p className="text-destructive">
                No associated clients — add at least one from the panel before publishing.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {portfolio.clients.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-accent border border-border"
                    title={c.email}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || portfolio.clients.length === 0}
            onClick={() => void submit()}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            {loading ? "Publishing…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
