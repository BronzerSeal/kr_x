import { auth } from "@/auth/auth";
import AppLoader from "@/hoc/app-loader";
import { Providers } from "@/providers/providers";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "SkyWay Travel Portal",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="ru">
      <body className="antialiased">
        <SessionProvider session={session}>
          <Providers>
            <AppLoader>{children}</AppLoader>
          </Providers>
        </SessionProvider>
        <ToastContainer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
