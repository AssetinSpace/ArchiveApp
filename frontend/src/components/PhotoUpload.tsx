import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api } from "../api";

// Kompresia nad 2 MB — väčšina fotiek štítkov z telefónu má 3–6 MB, downscale na
// 2400 px (krátka strana) vystačí na čítanie OCR a šetrí R2 traffic + bandwidth.
const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024;
const COMPRESS_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
};

type Props = {
  itemId: string;
};

export function PhotoUpload({ itemId }: Props): React.JSX.Element {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      let payload: File = file;
      if (file.size > COMPRESS_THRESHOLD_BYTES) {
        setBusyLabel("Komprimujem fotku…");
        const compressed = await imageCompression(file, COMPRESS_OPTIONS);
        // browser-image-compression vracia Blob na niektorých build targetoch;
        // pretypujeme na File aby multer videl pôvodné meno/MIME.
        payload =
          compressed instanceof File
            ? compressed
            : new File([compressed], file.name, { type: file.type });
      }
      setBusyLabel("Nahrávam na server…");
      return api.uploadPhoto(itemId, payload);
    },
    onSuccess: async () => {
      setError(null);
      setBusyLabel(null);
      // Invalidácia musí matchnúť presne queryKey z PhotoGallery — bez tohto by
      // sa nová fotka nezobrazila kým používateľ nerefreshne.
      await qc.invalidateQueries({ queryKey: ["items", itemId, "photos"] });
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (e: Error) => {
      setError(e.message);
      setBusyLabel(null);
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    uploadMut.mutate(file);
  }

  const busy = uploadMut.isPending;

  return (
    <div className="stack" style={{ gap: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChosen}
        disabled={busy}
        style={{ display: "none" }}
        id={`photo-upload-${itemId}`}
      />
      <label
        htmlFor={`photo-upload-${itemId}`}
        className="btn-primary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 44,
          padding: "0 16px",
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
          alignSelf: "flex-start",
        }}
      >
        {busy ? busyLabel ?? "Pracujem…" : "+ Pridať fotku"}
      </label>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
