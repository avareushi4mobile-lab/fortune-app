import React from 'react';

export default function TokushohoPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-800">
      <h1 className="text-2xl font-bold mb-6 border-b pb-2">特定商取引法に基づく表記</h1>
      <div className="space-y-4">
        <div>
          <p className="font-bold">販売業者</p>
          <p>清子（個人事業主）</p>
        </div>
        <div>
          <p className="font-bold">代表責任者</p>
          <p>清子</p>
        </div>
        <div>
          <p className="font-bold">所在地・電話番号</p>
          <p>消費者からの請求に基づき、遅滞なく電子メール等の適切な方法により提供いたします。ご希望の方は下記メールアドレスまでご連絡ください。</p>
        </div>
        <div>
          <p className="font-bold">メールアドレス</p>
          <p>（ここにStripeに登録したメールアドレス）</p>
        </div>
        <div>
          <p className="font-bold">販売価格</p>
          <p>各購入ページ（プラン選択画面）に表示される金額（税込）</p>
        </div>
        <div>
          <p className="font-bold">商品代金以外の必要料金</p>
          <p>なし（サイト閲覧、コンテンツ利用にかかる通信料はお客様負担となります）</p>
        </div>
        <div>
          <p className="font-bold">支払方法・時期</p>
          <p>クレジットカード決済、PayPay（予定）：注文確定時に決済されます。</p>
        </div>
        <div>
          <p className="font-bold">商品の引渡時期</p>
          <p>決済手続き完了後、即時に占い鑑定結果を画面上に表示します。</p>
        </div>
        <div>
          <p className="font-bold">返品・キャンセルについて</p>
          <p>デジタルコンテンツの性質上、決済完了後の返品・返金・キャンセルには応じられません。</p>
        </div>
      </div>
    </div>
  );
}
