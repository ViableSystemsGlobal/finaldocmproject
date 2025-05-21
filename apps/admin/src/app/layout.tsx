import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CICS Admin",
  description: "Church Information & Communication System Admin",
};

// Custom ToastWrapper component that includes toast functionality
function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div id="toast-container" className="fixed bottom-0 right-0 p-4 space-y-2 z-50" />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        <ToastContainer>
          {children}
        </ToastContainer>
      </body>
    </html>
  );
}
