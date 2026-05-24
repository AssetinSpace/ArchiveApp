import { useEffect, useRef, useState } from "react";

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  title?: string;
}

type ModalState = "loading" | "previewing" | "captured" | "error";

function getErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") return "Prístup k fotoaparátu bol zamietnutý.";
    if (err.name === "NotFoundError") return "Fotoaparát nebol nájdený.";
  }
  if (err instanceof Error) return err.message;
  return "Neznáma chyba.";
}

export function WebcamCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Odfotiť",
}: WebcamCaptureModalProps): React.JSX.Element | null {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [modalState, setModalState] = useState<ModalState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  function stopStream(): void {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera(): Promise<void> {
    setModalState("loading");
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setModalState("previewing");
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
      setModalState("error");
    }
  }

  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setCapturedUrl(null);
      void startCamera();
    } else {
      stopStream();
      setCapturedBlob(null);
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl);
        setCapturedUrl(null);
      }
      setModalState("loading");
      setErrorMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose(): void {
    stopStream();
    onClose();
  }

  function handleCapture(): void {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedUrl(url);
        setModalState("captured");
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleRecapture(): void {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setCapturedBlob(null);
    setModalState("previewing");
  }

  function handleConfirm(): void {
    if (!capturedBlob) return;
    onCapture(capturedBlob);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="webcam-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="webcam-modal-card">
        {/* Header */}
        <div className="webcam-modal-header">
          <span className="webcam-modal-title">{title}</span>
          <button
            type="button"
            className="webcam-modal-close"
            onClick={handleClose}
            aria-label="Zavrieť"
          >
            ✕
          </button>
        </div>

        {/* Media area */}
        <div className="webcam-modal-media">
          {/* Video always mounted so ref is available; hidden when captured */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-modal-video"
            style={{ display: modalState === "captured" ? "none" : "block" }}
          />

          {modalState === "captured" && capturedUrl && (
            <img
              src={capturedUrl}
              alt="Zachytený snímok"
              className="webcam-modal-video"
            />
          )}

          {modalState === "loading" && (
            <div className="webcam-modal-overlay-msg">Spúšťam kameru…</div>
          )}

          {modalState === "error" && (
            <div className="webcam-modal-overlay-msg webcam-modal-error-msg">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Hint */}
        {modalState === "previewing" && (
          <p className="webcam-modal-hint">
            Polož štítok pod kameru a klikni Odfotiť
          </p>
        )}

        {/* Actions */}
        <div className="webcam-modal-actions">
          {modalState === "previewing" && (
            <>
              <button
                type="button"
                className="webcam-btn webcam-btn-primary"
                onClick={handleCapture}
              >
                Odfotiť
              </button>
              <button
                type="button"
                className="webcam-btn webcam-btn-neutral"
                onClick={handleClose}
              >
                Zrušiť
              </button>
            </>
          )}

          {modalState === "captured" && (
            <>
              <button
                type="button"
                className="webcam-btn webcam-btn-primary"
                onClick={handleConfirm}
              >
                Použiť
              </button>
              <button
                type="button"
                className="webcam-btn webcam-btn-neutral"
                onClick={handleRecapture}
              >
                Znovu
              </button>
            </>
          )}

          {modalState === "error" && (
            <>
              <button
                type="button"
                className="webcam-btn webcam-btn-primary"
                onClick={() => void startCamera()}
              >
                Skúsiť znovu
              </button>
              <button
                type="button"
                className="webcam-btn webcam-btn-neutral"
                onClick={handleClose}
              >
                Zrušiť
              </button>
            </>
          )}

          {modalState === "loading" && (
            <button
              type="button"
              className="webcam-btn webcam-btn-neutral"
              onClick={handleClose}
            >
              Zrušiť
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
