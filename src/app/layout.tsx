import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { auth } from "@/server/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Product OS",
  description: "Internal operating system for building the product.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const signedIn = !!session?.user;
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}>
        {signedIn ? (
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppTopbar userEmail={session?.user?.email} />
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
