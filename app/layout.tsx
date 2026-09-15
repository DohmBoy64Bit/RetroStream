import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RetroStream — Find your next great watch",
  description: "Discover movies and series. Explore popular titles, find your favorites, and pick your next episode. No account required.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="retrostream">
      <head>
        <link rel="stylesheet" href="/retrostream.css" />
        <link rel="stylesheet" href="/watch-states.css" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
