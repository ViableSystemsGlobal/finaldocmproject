import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers";
import { TimezoneInitializer } from '@/components/TimezoneInitializer'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Church Management System Admin",
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
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <TimezoneInitializer />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <ToastContainer>
              {children}
            </ToastContainer>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
