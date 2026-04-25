import "./globals.css";

export const metadata = {
  title: "RAXION Devnet Explorer",
  description: "Live PoIQ convergence feed from Solana devnet",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
