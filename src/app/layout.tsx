import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth";
import { ToastProvider } from "@/components/notifications/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "営業日報システム",
  description: "営業担当者の日報管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
