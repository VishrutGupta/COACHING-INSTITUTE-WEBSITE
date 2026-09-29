import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Coaching Institute",
    template: "%s | Coaching Institute",
  },
  description:
    "A modern coaching institute offering expert-led courses for students and competitive exam aspirants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
