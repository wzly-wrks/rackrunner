import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

type Props = {
  onScan: (text: string) => void;
};

export default function Scanner({ onScan }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Initialize scanner only once
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        ref.current.id,
        { fps: 5, qrbox: 250 },
        false
      );
      scannerRef.current.render(
        (decodedText) => onScan(decodedText),
        (error) => {
          // Only log errors that are not "No QR code found"
          if (!error.includes("NotFoundException")) {
            console.error("QR Scanner error:", error);
          }
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => undefined);
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  return <div id="scanner" ref={ref} />;
}
