"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { FORTUNE_GENRES, type FortuneGenre } from "@/lib/fortune-genres";

type Plan = "free" | "standard" | "premium" | "extreme";
type Phase = "idle" | "shuffling" | "revealing" | "typing" | "done";

export default function Home() {
  const [plan, setPlan] = useState<Plan>("free");       
  const [genre, setGenre] = useState<FortuneGenre | null>(null);
  const [question, setQuestion] = useState("");
  const [birthday, setBirthday] = useState("");
  const [partnerBirthday, setPartnerBirthday] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [isShuffleDone, setIsShuffleDone] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [sessionSeed] = useState(() => Math.random().toString(36).substring(7));

  // パスワード設定
  const PASSWORDS = { 
    ADMIN: "kiyoko777",      // 管理者
    FREE_3: "lucky",         // 無料枠増加用
    PREMIUM_FREE: "premium"  // 有料プラン用
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I") || (e.ctrlKey && e.key === "u")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const cardCount = useMemo(() => {
    const map: Record<Plan, number> = { free: 1, standard: 3, premium: 7, extreme: 10 };
    return map[plan];
  }, [plan]);

  const shuffleCardsData = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i, delay: `${i * 100}ms`, duration: `60s`,
      "--start-angle": `${(i * 360) / 22}deg`, "--radius": `${15 + Math.random() * 20}vw`,
    }));
  }, [phase === "shuffling"]);

  const getCardImage = (cardNum: number) => `https://picsum.photos/seed/${sessionSeed}-${cardNum}/200/300`;

  useEffect(() => {
    if (phase !== "shuffling") return;
    const timer = window.setTimeout(() => setIsShuffleDone(true), 7000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (isShuffleDone && !isRequestPending) setPhase("revealing");
  }, [isRequestPending, isShuffleDone]);

  useEffect(() => {
    if (phase !== "typing" || !finalAnswer) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 5;
      setTypedAnswer(finalAnswer.slice(0, index));
      if (index >= finalAnswer.length) { window.clearInterval(timer); setPhase("done"); }
    }, 20);
    return () => window.clearInterval(timer);
  }, [phase, finalAnswer]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setAllRevealed(false);

    // 全角英数字を半角に、大文字を小文字に変換する関数
    const normalize = (str: string) => {
      return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      }).toLowerCase();
    };

    const normalizedQuestion = normalize(question);
    const hasAdminPass = normalizedQuestion.includes(normalize(PASSWORDS.ADMIN));
    const hasPremiumPass = normalizedQuestion.includes(normalize(PASSWORDS.PREMIUM_FREE));

    if (question.match(/死|殺|消えたい|終わりにしたい/)) {
      setError("早まらないでください。解決策は他にもあるはずです。今は突発的な行動は避けるべきです。");
      return;
    }

    if (plan === "free" && !hasAdminPass) {
      const campaignEndDate = new Date("2026-06-30T23:59:59");
      if (new Date() > campaignEndDate) {
        const lastFortuneDate = localStorage.getItem("last_fortune_date");
        if (lastFortuneDate === new Date().toLocaleDateString()) {
          setError("本日の無料鑑定は終了しました。続きはまた明日か、有料プランをご利用ください。");
          return;
        }
      }
    }

// 有料プランならStripe決済へ飛ばす
    if (plan !== "free" && !hasAdminPass && !hasPremiumPass) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url; // Stripeのページへジャンプ
          return;
        } else {
          setError("決済画面の作成に失敗しました。");
          return;
        }
      } catch (err) {
        setError("通信エラーが発生しました。");
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (!genre || !question.trim()) { setError("ジャンルと相談内容を入力してください。"); return; }

    const deck = Array.from({ length: 22 }, (_, i) => i);
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);
    const chosenCards = shuffledDeck.slice(0, cardCount);
    setSelectedCards(chosenCards);

    setPhase("shuffling");
    setIsRequestPending(true);
    setIsShuffleDone(false);

    const planConfig = {
      free: "無料プラン（250文字以内。形式『結論：』『アドバイス：』。占星術禁止。改行必須）",
      standard: "通常プラン（800文字以内。カードのみ。占星術禁止。主語は『相手』。改行必須）",
      premium: "豪華プラン（1500文字以内。占星術使用。最後は『あなたは〜の傾向が強いかもしれません』で締める。主語は『相手』。改行必須）",
      extreme: "極プラン（2000文字以内。占星術使用。鑑定の最後、本質診断の直前に必ず『あなたの星の配置を確認いたしましたが、あなたは〜の傾向が強いかもしれません』という文言で締める。主語は『相手』。改行必須）"
    }[plan];

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: question.replace(new RegExp(`${PASSWORDS.ADMIN}|${PASSWORDS.FREE_3}|${PASSWORDS.PREMIUM_FREE}`, "gi"), ""), 
          plan: planConfig, 
          genre, 
          birthday: birthday || "未設定",
          partnerBirthday: partnerBirthday || "未設定",
          cards: chosenCards.join(",") 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error("通信環境の良い場所で再度お試しください。");

      let fortuneText = data.answer.trim();
      if (fortuneText.startsWith("```")) {
        fortuneText = fortuneText.replace(/```json/g, "").replace(/```/g, "").trim();
      }
      try {
        const parsed = JSON.parse(fortuneText);
        fortuneText = parsed.answer || fortuneText;
      } catch (e) {}

      if (plan === "free" && fortuneText.length > 250) {
        const lastPeriod = fortuneText.lastIndexOf("。", 250);
        fortuneText = lastPeriod > 100 ? fortuneText.substring(0, lastPeriod + 1) : fortuneText.substring(0, 247) + "...";
      }

      setFinalAnswer(fortuneText);
      if (plan === "free") {
        localStorage.setItem("last_fortune_date", new Date().toLocaleDateString());
      }
    } catch (err: any) { setError(err.message); setPhase("idle"); } finally { setIsRequestPending(false); }
  };

  return (
    <div className="relative min-h-screen bg-[#070707] px-6 py-12 text-[#f5e6b7]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#3a2c13_0%,#0b0b0b_45%,#050505_100%)] opacity-70" />
      
      <a href="[https://your-site.com](https://your-site.com)" target="_blank" rel="noreferrer" className="fixed bottom-8 right-8 z-[100] hover:scale-110 transition duration-300">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d5ab55] border-2 border-[#8f7333] overflow-hidden shadow-lg">
           <img src="/my-icon.png" alt="清子" className="w-full h-full object-cover" />
        </div>
      </a>

      <button onClick={() => setShowHelp(true)} className="fixed bottom-8 left-8 z-[100] h-12 w-12 rounded-full bg-white text-black font-bold text-2xl shadow-lg hover:bg-[#f5e6b7]">?</button>

      {showHelp && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setShowHelp(false)}>
          <div className="max-w-md rounded-2xl border border-[#d5ab55] bg-[#111] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-[#d5ab55]">使い方のヒント</h3>
            <p className="text-sm leading-relaxed text-[#f5e6b7]/90 mb-6">
              プランを選択し、お悩みを入力してください。最高峰の【極プラン】では、お相手の生年月日（または設立日）から星の動きを深く読み解きます。
            </p>
            <div className="pt-4 border-t border-[#d5ab55]/20">
              <p className="text-[11px] leading-relaxed text-[#a8946a]">
                ※ご入力いただいた個人データは鑑定にのみ使用され、保存・転用されることはありません。
              </p>
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-6 rounded-full bg-[#d5ab55] py-3 text-black font-bold">閉じる</button>
          </div>
        </div>
      )}

      {phase === "shuffling" && (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 overflow-hidden">
          <p className="absolute z-0 text-2xl tracking-[0.6em] text-[#d5ab55] opacity-40 font-bold animate-pulse">SPIRITUAL MIXING...</p>
          <div className="relative w-full h-full flex items-center justify-center z-10">
            {shuffleCardsData.map((card) => (
              <div key={card.id} className="swirl-card" style={card as CSSProperties}><span className="shuffle-card-inner" /></div>
            ))}
          </div>
        </section>
      )}

      <main className="relative z-10 mx-auto max-w-4xl rounded-2xl border border-[#8f7333]/50 bg-[#111111]/90 p-6 md:p-10 shadow-lg">
        <h1 className="text-3xl font-bold tracking-wide flex items-baseline gap-2">
          あなたの専属占い師 <span className="text-sm font-normal text-[#d7c089]">(監修：清子)</span>
        </h1>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#d7c089]">鑑定プランを選択</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
              {id: "free", label: "無料", price: "0円"},
              {id: "standard", label: "通常", price: "price_1TW71jBaBEaG1KW6bWlkNeB0"},
              {id: "premium", label: "豪華", price: "price_1TW73PBaBEaG1KW6Vpzo1IJ7"},
              {id: "extreme", label: "極", price: "price_1TW6zeBaBEaG1KW6WORVK1Bh"}
              ].map((p) => (
                <button key={p.id} type="button" onClick={() => setPlan(p.id as Plan)} className={`flex flex-col items-center rounded-xl border p-3 transition ${plan === p.id ? "border-[#d5ab55] bg-[#d5ab55]/10" : "border-[#444]"}`}>
                  <span className="text-sm font-bold">{p.label}</span>
                  <span className="text-[10px] opacity-60">{p.id === "free" ? p.price : (p.id === "standard" ? "500円" : (p.id === "premium" ? "1500円" : "2980円"))}</span>
                </button>
              ))}
            </div>
          </div>

          {(plan === "premium" || plan === "extreme") && (
            <div className="space-y-4 rounded-xl border border-[#d5ab55]/20 bg-white/5 p-4">
              <div className="space-y-2">
                <p className="text-sm text-[#d7c089] font-bold">あなたの生年月日</p>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full rounded-lg border border-[#6e5a2d] bg-[#0b0b0b] p-3 text-[#f7e6bd] outline-none" />
              </div>
              {plan === "extreme" && (
                <div className="space-y-2 pt-2 border-t border-[#6e5a2d]/30">
                  <p className="text-sm text-[#d7c089] font-bold">相手の生年月日（または設立日）</p>
                  <input type="date" value={partnerBirthday} onChange={(e) => setPartnerBirthday(e.target.value)} className="w-full rounded-lg border border-[#6e5a2d] bg-[#0b0b0b] p-3 text-[#f7e6bd] outline-none" />
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {FORTUNE_GENRES.map((g) => (
                <button key={g} type="button" onClick={() => setGenre(g)} className={`rounded-full border px-4 py-2 text-sm ${genre === g ? "bg-[#d5ab55] text-black" : "border-[#6e5a2d]"}`}>{g}</button>
              ))}
            </div>
            <textarea className="h-32 w-full rounded-xl border border-[#6e5a2d] bg-[#0b0b0b] p-3 text-[#f7e6bd] focus:border-[#d5ab55] outline-none" placeholder="今、悩んでいることを詳しく教えてください..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>

          <button type="submit" className="w-full rounded-full bg-[#c7983f] py-4 font-bold text-black hover:bg-[#d5ab55] transition text-lg shadow-lg">
            {plan === "free" ? "お試し鑑定を受ける（無料）" : "本鑑定を開始する"}
          </button>
        </form>

        {error && <p className="mt-6 text-red-400 text-center bg-red-950/30 p-3 rounded-lg border border-red-500/50">{error}</p>}

        {(phase === "revealing" || phase === "typing" || phase === "done") && (
          <section className="mt-10 border-t border-[#6e5a2d] pt-8 text-center">
            <h2 className="text-lg font-semibold text-[#f5d995] mb-6">導かれたカードをめくってください</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {selectedCards.map((cardNum, index) => (
                <button key={index} onClick={() => { setAllRevealed(true); if(phase==="revealing") setPhase("typing"); }} className={`relative w-24 h-36 transition-transform duration-700 [transform-style:preserve-3d] ${allRevealed ? "[transform:rotateY(180deg)]" : ""}`}>
                  <div className="absolute inset-0 flex items-center justify-center border border-[#d5ab55] bg-[#1a1a1a] rounded-lg [backface-visibility:hidden]"><span className="text-[#d5ab55] text-2xl">✦</span></div>
                  <div className="absolute inset-0 border border-[#d5ab55] bg-black rounded-lg [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden"><img src={getCardImage(cardNum)} className="w-full h-full object-cover opacity-80" alt="card" /></div>
                </button>
              ))}
            </div>
          </section>
        )}

        {(phase === "typing" || phase === "done") && (
          <div className="mt-10 rounded-xl border border-[#d5ab55]/30 bg-[#0a0a0a] p-8 shadow-inner">
            <h2 className="text-2xl font-bold text-[#f2d389] mb-4">鑑定書</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-[#eedeb2] text-lg">{typedAnswer}</p>
          </div>
        )}
      </main>
    </div>
  );
}
