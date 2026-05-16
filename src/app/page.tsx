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

  const PASSWORDS = { 
    ADMIN: "kiyoko777",
    FREE_3: "lucky",
    PREMIUM_FREE: "premium",
    NORMAL_500: "normal500",   
    GOHA_1500: "goha1500",     
    KIWAMI_3000: "kiwami3000"  
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

  // シャッフル中(shuffling)の時だけ動画用データを生成する安全ガード
  const shuffleCardsData = useMemo(() => {
    if (phase !== "shuffling") return [];
    return Array.from({ length: 22 }).map((_, i) => {
      const startAngle = (i * 360) / 22;
      const radius = 15 + Math.random() * 20;
      return {
        id: i,
        delay: `${i * 100}ms`,
        duration: `60s`,
        "--start-angle": `${startAngle}deg`,
        "--radius": `${radius}vw`,
      };
    });
  }, [phase]);

  const getCardImage = (cardNum: number) => {
    return `https://picsum.photos/seed/tarot-${cardNum}/200/300`;
  };

  // 7秒のシャッフルタイマー
  useEffect(() => {
    if (phase !== "shuffling") return;
    const timer = window.setTimeout(() => setIsShuffleDone(true), 7000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // シャッフルと通信の両方がクリアされたら画面を移行
  useEffect(() => {
    if (isShuffleDone && !isRequestPending && phase === "shuffling") {
      setPhase("revealing");
    }
  }, [isRequestPending, isShuffleDone, phase]);

  // 文字送りタイピング演出
  useEffect(() => {
    if (phase !== "typing" || !finalAnswer) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 5;
      setTypedAnswer(finalAnswer.slice(0, index));
      if (index >= finalAnswer.length) {
        window.clearInterval(timer);
        setPhase("done");
      }
    }, 20);
    return () => window.clearInterval(timer);
  }, [phase, finalAnswer]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setAllRevealed(false);
    setTypedAnswer("");
    setFinalAnswer("");

    if (question.match(/死|殺|消えたい|終わりにしたい/)) {
      setError("早まらないでください。解決策は他にもあるはずです。");
      return;
    }

    if (!genre || !question.trim()) {
      setError("ジャンルと相談内容を詳しく入力してください。。。");
      return;
    }

    const normalize = (str: string) => {
      return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      }).toLowerCase();
    };

    const normalizedQuestion = normalize(question);
    const hasAdminPass = normalizedQuestion.includes(normalize(PASSWORDS.ADMIN));
    const hasPremiumPass = normalizedQuestion.includes(normalize(PASSWORDS.PREMIUM_FREE));
    const hasPaidPass = 
      normalizedQuestion.includes(normalize(PASSWORDS.NORMAL_500)) ||
      normalizedQuestion.includes(normalize(PASSWORDS.GOHA_1500)) ||
      normalizedQuestion.includes(normalize(PASSWORDS.KIWAMI_3000));

    if (plan !== "free" && !hasAdminPass && !hasPremiumPass && !hasPaidPass) {
      setError("このプランを利用するには、STORESで購入した正しいパスワード（認証コード）を相談内容に含めて入力してください。");
      return;
    }

    const deck = Array.from({ length: 22 }, (_, i) => i);
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);
    const chosenCards = shuffledDeck.slice(0, cardCount);
    setSelectedCards(chosenCards);

    // シャッフル演出スタート
    setPhase("shuffling");
    setIsRequestPending(true);
    setIsShuffleDone(false);

    const planConfig = {
      free: "無料プラン（250文字以内。形式『結論：』『アドバイス：』。占星術禁止。改行必須）",
      standard: "通常プラン（700文字以内。カードのみ。占星術禁止。主語は『相手』。改行必須）",
      premium: "豪華プラン（1100文字以内。占星術使用。主語は『相手』。改行必須）",
      extreme: "極プラン（1800文字以内。占星術使用。主語は『相手』。改行必須）"
    }[plan];

    const maskPatterns = [
      PASSWORDS.ADMIN,
      PASSWORDS.FREE_3,
      PASSWORDS.PREMIUM_FREE,
      PASSWORDS.NORMAL_500,
      PASSWORDS.GOHA_1500,
      PASSWORDS.KIWAMI_3000
    ].join("|");

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: question.replace(new RegExp(maskPatterns, "gi"), ""), 
          plan: planConfig, 
          genre, 
          birthday: birthday || "未設定",
          partnerBirthday: partnerBirthday || "未設定",
          cards: chosenCards.join(",") 
        }),
      });

      const data = await response.json();

      if (!response.ok || (data && data.error)) {
        throw new Error(data.error || `Difyとの通信に失敗しました(Status: ${response.status})。`);
      }

      setFinalAnswer(data.answer.trim());
      
    } catch (err: any) { 
      setError(err.message || "通信エラーが発生しました。"); 
      setPhase("idle"); // エラー時はフォーム画面に戻す
    } finally {
      setIsRequestPending(false);
    }
  };

  const handleRevealAll = () => {
    setAllRevealed(true);
    if (phase === "revealing") setPhase("typing");
  };

  return (
    <div className="relative min-h-screen bg-[#070707] px-6 py-12 text-[#f5e6b7] overflow-x-hidden">
      
      {/* シャッフルフェーズ以外の時は、絶対配置CSSを強制完全無効化 */}
      <style jsx global>{`
        ${phase !== "shuffling" ? `
          .swirl-card, .shuffle-card-inner {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        ` : ""}
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#3a2c13_0%,#0b0b0b_45%,#050505_100%)] opacity-70" />

      {/* 【成功配置の復元】動画は鑑定文エリアではなく、画面全体の最前面（fixed inset-0 z-50）に完全隔離して表示 */}
      {phase === "shuffling" && !error && shuffleCardsData.length > 0 && (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             <p className="text-2xl tracking-[0.6em] text-[#d5ab55] opacity-20 font-bold animate-pulse">
                SPIRITUAL MIXING...
             </p>
          </div>
          <div className="relative w-full h-full flex items-center justify-center z-10">
            {shuffleCardsData.map((card) => (
              <div key={card.id} className="swirl-card" style={card as CSSProperties}>
                <span className="shuffle-card-inner" />
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="relative z-10 mx-auto max-w-4xl rounded-2xl border border-[#8f7333]/50 bg-[#111111]/90 p-6 md:p-10 shadow-lg">
        <h1 className="text-3xl font-bold tracking-wide flex items-baseline gap-3">
          あなたの専属占い師 <span className="text-sm font-normal text-[#d7c089]">(監修：清子)</span>
        </h1>
       
        {/* エラーアラート */}
        {error && (
          <div className="mt-6 text-red-400 text-center bg-red-950/40 p-4 rounded-lg border border-red-500/50 relative z-50">
            <p className="font-bold mb-1">⚠️ エラーが発生しました</p>
            <p className="text-sm mb-2">{error}</p>
            <button onClick={() => { setError(""); setPhase("idle"); }} className="px-4 py-1 bg-red-800 text-white rounded-full text-xs hover:bg-red-700 transition">
              入力画面をクリアして戻る
            </button>
          </div>
        )}

        {/* 【1】入力フォームエリア */}
        {phase === "idle" && !error && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#d7c089]">鑑定プランを選択</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["free", "standard", "premium", "extreme"].map((p) => (
                  <button key={p} type="button" onClick={() => setPlan(p as Plan)} className={`flex flex-col items-center rounded-xl border p-3 transition ${plan === p ? "border-[#d5ab55] bg-[#d5ab55]/10" : "border-[#444]"}`}>
                    <span className="text-sm font-bold">{{free:"無料",standard:"通常",premium:"豪華",extreme:"極"}[p]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 生年月日入力 */}
            {(plan === "premium" || plan === "extreme") && (
              <div className="space-y-4 rounded-xl border border-[#d5ab55]/20 bg-white/5 p-4">
                <div className="space-y-2">
                  <p className="text-sm text-[#d7c089] font-bold">あなたの生年月日</p>
                  <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full rounded-lg border border-[#6e5a2d] bg-[#0b0b0b] p-3 text-[#f7e6bd] outline-none" />
                </div>

                {plan === "extreme" && (
                  <div className="space-y-2 pt-2 border-t border-[#6e5a2d]/30">
                    <p className="text-sm text-[#d7c089] font-bold">お相手の生年月日</p>
                    <input type="date" value={partnerBirthday} onChange={(e) => setPartnerBirthday(e.target.value)} className="w-full rounded-lg border border-[#6e5a2d] bg-[#0b0b0b] p-3 text-[#f7e6bd] outline-none" />
                    <p className="text-[10px] text-[#a8946a]">※お相手との宿命的な相性を深く読み解きます。</p>
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
              <textarea className="h-32 w-full rounded-xl border border-[#6e5a2d] bg-[#0b0b0b] p-3 text-[#f7e6bd] outline-none" placeholder="今、悩んでいることを詳しく教えてください..." value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>

            <button type="submit" className="w-full rounded-full bg-[#c7983f] py-4 font-bold text-black hover:bg-[#d5ab55] transition text-lg shadow-lg">
              {plan === "free" ? "お試し鑑定を受ける（無料）" : "本鑑定を開始する"}
            </button>
          </form>
        )}

        {/* 【2】カード選択エリア */}
        {(phase === "revealing" || phase === "typing" || phase === "done") && !error && (
          <section className="mt-10 border-t border-[#6e5a2d] pt-8 text-center relative z-40">
            <h2 className="text-lg font-semibold text-[#f5d995] mb-6">導かれたカードをめくってください</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {selectedCards.map((cardNum, index) => (
                <button key={index} onClick={handleRevealAll} className={`relative w-24 h-36 transition-transform duration-700 [transform-style:preserve-3d] ${allRevealed ? "[transform:rotateY(180deg)]" : ""}`}>
                  <div className="absolute inset-0 flex items-center justify-center border border-[#d5ab55] bg-[#1a1a1a] rounded-lg [backface-visibility:hidden]">
                    <span className="text-[#d5ab55] text-2xl">✦</span>
                  </div>
                  <div className="absolute inset-0 border border-[#d5ab55] bg-black rounded-lg [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden">
                    <img src={getCardImage(cardNum)} alt="card" className="w-full h-full object-cover opacity-80" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 【3】鑑定書表示エリア */}
        {(phase === "typing" || phase === "done") && !error && (
          <div className="mt-10 rounded-xl border border-[#d5ab55]/30 bg-[#0a0a0a] p-8 shadow-inner relative z-50">
            <h2 className="text-2xl font-bold text-[#f2d389] mb-6">鑑定書</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-[#eedeb2] text-lg">{typedAnswer}</p>
          </div>
        )}
      </main>
    </div>
  );
}
