import { auth } from "@/auth/auth";
import AppLoader from "@/hoc/app-loader";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";

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
          <AppLoader>{children}</AppLoader>
        </SessionProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
