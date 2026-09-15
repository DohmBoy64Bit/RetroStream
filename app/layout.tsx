import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RetroStream",
  description: "Discover movies and series without an account.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
