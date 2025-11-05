import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

type Props = {
  onScan: (text: string) => void;
};

export default function Scanner({ onScan }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const scanner = new Html5QrcodeScanner(ref.current.id, { fps: 5, qrbox: 250 });
    scanner.render((decodedText) => onScan(decodedText), () => {});

    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [onScan]);

  return <div id="scanner" ref={ref} />;
}
