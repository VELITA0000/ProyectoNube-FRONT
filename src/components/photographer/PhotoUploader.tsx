import { useCallback, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { photoService } from "@/services/photoService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  portfolioId: string;
  onUploaded?: () => void;
}

export function PhotoUploader({ portfolioId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) {
        toast({
          title: "Invalid files",
          description: "Only images are allowed.",
          variant: "destructive",
        });
        return;
      }
      setUploading((c) => c + files.length);
      let ok = 0;
      let fail = 0;
      await Promise.all(
        files.map(async (file) => {
          try {
            const presigned = await photoService.getPresignedUpload({
              portfolioId,
              fileName: file.name,
              contentType: file.type,
            });
            await photoService.uploadToPresigned(presigned, file);
            ok++;
          } catch (err) {
            console.error("upload failed", err);
            fail++;
          } finally {
            setUploading((c) => c - 1);
          }
        }),
      );
      if (ok > 0) {
        toast({
          title: `${ok} photo${ok > 1 ? "s" : ""} uploaded`,
          description: "They are private until you publish the portfolio.",
        });
        onUploaded?.();
      }
      if (fail > 0) {
        toast({
          title: `${fail} upload${fail > 1 ? "s" : ""} failed`,
          variant: "destructive",
        });
      }
    },
    [portfolioId, onUploaded, toast],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "border border-dashed border-border rounded-lg p-8 bg-card transition-colors",
        dragOver ? "border-primary bg-accent" : "hover:border-muted-foreground/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center text-center gap-3">
        {uploading > 0 ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground" />
        )}
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {uploading > 0 ? `Uploading (${uploading})` : "Drag or choose files"}
          </div>
          <div className="font-serif text-xl text-foreground">
            {uploading > 0 ? "Processing…" : "Upload photos to portfolio"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP</div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0}
          className="text-sm px-4 py-2 rounded-md border border-border bg-background hover:bg-accent disabled:opacity-40"
        >
          Choose files
        </button>
      </div>
    </div>
  );
}
