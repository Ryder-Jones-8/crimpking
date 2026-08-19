import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth/AuthProvider";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SendCheck — Climb Rating Normalization",
  description: "Scan a QR code to rate boulder problems and routes, and see difficulty grades normalized across gyms.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SendCheck",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={oswald.variable}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <AuthProvider>
          {/* Mobile app shell: full-bleed on phones, framed like a device on wider screens */}
          <div className="outdoor-texture relative mx-auto min-h-screen w-full max-w-md sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-[2.5rem] sm:border sm:border-slate-800 sm:shadow-2xl sm:shadow-black/50 overflow-hidden flex flex-col">
            <div className="safe-top" />
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              {children}
            </div>
            <BottomNav />
          </div>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
