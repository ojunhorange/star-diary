import type { Metadata } from "next";
import { Gowun_Dodum, Gowun_Batang } from "next/font/google";
import "./globals.css";

const dodum = Gowun_Dodum({ weight: "400", subsets: ["latin"], variable: "--font-dodum" });
const batang = Gowun_Batang({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-batang" });

export const metadata: Metadata = {
  title: "별자리 일기",
  description: "하루에 별 하나. 일기가 쌓여 나만의 별자리가 됩니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${dodum.variable} ${batang.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
