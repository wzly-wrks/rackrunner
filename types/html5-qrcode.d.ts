declare module "html5-qrcode" {
  export class Html5QrcodeScanner {
    constructor(elementId: string, config: { fps: number; qrbox: number });
    render(onSuccess: (decodedText: string) => void, onError: (errorMessage: string) => void): void;
    clear(): Promise<void>;
  }
}
