import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Theo dõi nghị quyết",
  description: "Hệ thống theo dõi nghị quyết và tiến độ thực hiện văn bản của Đảng ủy phường Trung Nhứt",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ReactQueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
