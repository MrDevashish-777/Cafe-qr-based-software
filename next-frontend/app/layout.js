import "./globals.css";

export const metadata = {
  title: "QRDine",
  description: "Multi-tenant QR ordering PWA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        {children}
      </body>
    </html>
  );
}
