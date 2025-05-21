import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastContainer>
            {children}
          </ToastContainer>
        </ThemeProvider>
      </body>
    </html>
  );
}
