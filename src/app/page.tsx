import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";

// Same type pairing as the rest of the app: Fraunces for headlines/numbers,
// Inter for everything else. next/font handles self-hosting + no layout shift.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export default async function HomePage() {
  // Signed-in visitors don't need the marketing page — send them straight in.
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className={`${fraunces.variable} ${inter.variable} home`}>
      <style>{`
        .home {
          --ink: #1B2430;
          --paper: #FBF7EF;
          --paper-2: #F3EEE3;
          --line: #E4DCC8;
          --green: #2F5233;
          --rust: #B5502D;
          --brass: #C9A227;
          --teal: #3A6B72;
          --slate: #6B7280;

          min-height: 100vh;
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-inter), -apple-system, sans-serif;
        }
        .home * { box-sizing: border-box; }
        .home .num { font-family: var(--font-fraunces), Georgia, serif; }

        .home-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 40px; border-bottom: 1px solid var(--line);
        }
        .home-brand {
          font-family: var(--font-fraunces), Georgia, serif;
          font-style: italic; font-size: 22px; color: var(--ink); text-decoration: none;
        }
        .home-nav-links { display: flex; align-items: center; gap: 18px; }
        .home-nav-links a { color: var(--slate); text-decoration: none; font-size: 14px; }
        .home-nav-links a:hover { color: var(--ink); }
        .btn-brass {
          background: var(--brass); color: var(--ink); border: none;
          padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
          text-decoration: none; display: inline-block; cursor: pointer;
        }
        .btn-brass:hover { filter: brightness(0.95); }
        .btn-outline {
          border: 1px solid var(--ink); color: var(--ink); background: transparent;
          padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
          text-decoration: none; display: inline-block;
        }
        .btn-outline:hover { background: var(--ink); color: var(--paper); }

        .hero {
          max-width: 760px; margin: 0 auto; padding: 96px 32px 64px; text-align: center;
        }
        .hero h1 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 500; font-size: 44px; line-height: 1.15; margin: 0 0 20px;
        }
        .hero h1 em { color: var(--brass); font-style: italic; }
        .hero p {
          color: var(--slate); font-size: 17px; line-height: 1.6; margin: 0 auto 34px; max-width: 520px;
        }
        .hero-ctas { display: flex; gap: 14px; justify-content: center; }

        .ribbon {
          max-width: 900px; margin: 0 auto 96px; padding: 0 32px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
          background: var(--line); border: 1px solid var(--line); border-radius: 10px; overflow: hidden;
        }
        .ribbon-cell { background: white; padding: 28px 26px; }
        .ribbon-cell .label { font-size: 12.5px; color: var(--slate); margin-bottom: 8px; }
        .ribbon-cell .title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
        .ribbon-cell .desc { font-size: 13.5px; color: var(--slate); line-height: 1.55; }
        .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-right: 8px; }

        .home-footer {
          border-top: 1px solid var(--line); padding: 24px 40px;
          display: flex; justify-content: space-between; color: var(--slate); font-size: 12.5px;
        }

        @media (max-width: 640px) {
          .hero h1 { font-size: 32px; }
          .ribbon { grid-template-columns: 1fr; }
        }
      `}</style>

      

      <section className="hero">
        <h1>
          One shared ledger for two people who <em>trust each other</em> with the numbers.
        </h1>
        <p>
          Track spending, split it fairly, and always know who owes whom —
          without a shared spreadsheet or an awkward end-of-month conversation.
        </p>
        <div className="hero-ctas">
          <Link href="/sign-up" className="btn-brass">Get started — it&apos;s free</Link>
          <Link href="/sign-in" className="btn-outline">Sign in</Link>
        </div>
      </section>

      <div className="ribbon">
        <div className="ribbon-cell">
          <div className="label"><span className="dot" style={{ background: "var(--brass)" }} />Your budget</div>
          <div className="title">Separate, not shared</div>
          <div className="desc">Each partner sets their own budget per category — no more averaging two very different spending styles into one number.</div>
        </div>
        <div className="ribbon-cell">
          <div className="label"><span className="dot" style={{ background: "var(--teal)" }} />The ledger</div>
          <div className="title">Always know the balance</div>
          <div className="desc">Every shared expense is split automatically, down to the cent, so the running total of &quot;who owes whom&quot; is never a guess.</div>
        </div>
        <div className="ribbon-cell">
          <div className="label"><span className="dot" style={{ background: "var(--green)" }} />Connected accounts</div>
          <div className="title">Bank sync, no spreadsheets</div>
          <div className="desc">Link your accounts and let transactions flow in automatically, or add them by hand — the ledger stays accurate either way.</div>
        </div>
      </div>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} Balance</span>
        <span>Built for two.</span>
      </footer>
    </main>
  );
}
