import type { AppProps } from "next/app";
import Link from "next/link";
import "../styles.css";

const envLabel = process.env.NEXT_PUBLIC_ENVIRONMENT || "SBX";

export default function RackRunnerApp({ Component, pageProps }: AppProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="banner">Environment: {envLabel}</div>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/scan">Scanner</Link>
          <Link href="/freezer">Freezer</Link>
          <Link href="/planner">Planner</Link>
          <Link href="/audit">Audit</Link>
        </nav>
      </header>
      <main className="app-main">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
