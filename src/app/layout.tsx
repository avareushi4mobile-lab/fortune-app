import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIチャット・エンターテインメント | 清子",
  description: "AIキャラクターによる共感と励ましのメッセージ提供サービス",
  icons: {
    icon: "/my-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col font-sans">
        {/* メインコンテンツ */}
        <main className="flex-grow">{children}</main>

        {/* Stripe審査対策用フッター */}
        <footer className="bg-gray-50 border-t border-gray-200 pt-8 pb-12 mt-auto">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-sm text-gray-600">
              {/* 運営者情報・規約 */}
              <div>
                <h3 className="font-bold mb-3 text-gray-800">インフォメーション</h3>
                <ul className="space-y-2">
                  <li><a href="/tokushoho" class="hover:underline">特定商取引法に基づく表記</a></li>
                  <li><a href="/privacy" class="hover:underline">プライバシーポリシー</a></li>
                  <li><a href="/terms" class="hover:underline">利用規約</a></li>
                </ul>
              </div>

              {/* 免責事項 */}
              <div>
                <h3 className="font-bold mb-3 text-gray-800">免責事項</h3>
                <p className="leading-relaxed text-[10px]">
                  本サービスは、AI（人工知能）技術を活用した独自のアルゴリズムに基づく**エンターテインメント目的**のデジタルコンテンツ提供サービスです。<br />
                  提供されるメッセージは、特定の未来や効果を保証するものではなく、科学的根拠を伴うものではありません。自己内省や日々の活力としての参考情報（デジタルテキスト）をお楽しみいただくサービスです。
                </p>
              </div>
            </div>

            {/* コピーライト */}
            <div className="border-t border-gray-200 pt-6 text-center text-[10px] text-gray-400">
              <p>&copy; 2026 AI鑑定士 清子 運営事務局. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
