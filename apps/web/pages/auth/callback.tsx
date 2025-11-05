import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Placeholder for MSAL redirect handling
    router.replace("/scan");
  }, [router]);

  return <p>Signing you in…</p>;
}
