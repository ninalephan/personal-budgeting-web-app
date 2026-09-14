import { requireUser } from "@/lib/server/auth";
import { requireHousehold } from "@/lib/server/households/queries";
import { Sidebar } from "./Sidebar";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  await requireHousehold(user.id);

  return (
    <div className="dashboard-shell">
      <style>{`
        .dashboard-shell {
          display: flex;
          min-height: calc(100vh - 65px);
        }

        .rail {
          width: 216px;
          flex-shrink: 0;
          background: var(--ink);
          color: var(--paper);
          display: flex;
          flex-direction: column;
          padding: 24px 14px;
        }
        .rail-brand {
          font-family: var(--font-fraunces), Georgia, serif;
          font-style: italic;
          font-size: 22px;
          padding: 0 10px 22px;
          border-bottom: 1px solid rgba(251,247,239,0.14);
          margin-bottom: 18px;
        }
        .rail-nav { display: flex; flex-direction: column; gap: 2px; }
        .rail-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px;
          border-left: 2px solid transparent;
          border-radius: 0 4px 4px 0;
          color: rgba(251,247,239,0.62);
          cursor: pointer;
          background: transparent;
          border-top: none; border-right: none; border-bottom: none;
          font: inherit;
          font-size: 14px;
          text-align: left;
          text-decoration: none;
          width: 100%;
        }
        .rail-item:hover { color: var(--paper); background: rgba(251,247,239,0.06); }
        .rail-item.active {
          color: var(--paper);
          border-left-color: var(--brass);
          background: rgba(251,247,239,0.08);
        }
        .rail-item.disabled { color: rgba(251,247,239,0.32); cursor: default; }
        .rail-item.disabled:hover { background: transparent; color: rgba(251,247,239,0.32); }
        .rail-item svg { width: 16px; height: 16px; flex-shrink: 0; }
        .soon-tag {
          margin-left: auto; font-size: 9.5px; letter-spacing: 0.03em;
          color: rgba(251,247,239,0.4);
        }

        .dashboard-main { flex: 1; min-width: 0; }
        .page { padding: 28px 32px 48px; }
        .page h1 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 500; font-size: 22px; margin: 0 0 20px;
        }

        .grid-2 { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
        .panel { border: 1px solid var(--line); border-radius: 10px; background: white; padding: 20px 22px; }
        .panel h2 { font-size: 13px; font-weight: 600; margin: 0 0 14px; }
        .panel h3 { font-size: 12px; font-weight: 600; color: var(--slate); margin: 18px 0 8px; }
        .panel-hint { color: var(--slate); font-size: 12.5px; line-height: 1.5; margin: 0 0 16px; }

        .acct-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; gap: 10px; }
        .acct-row + .acct-row { border-top: 1px dashed var(--line); }
        .acct-name { font-size: 12.5px; display: flex; align-items: center; gap: 8px; }
        .tag { font-size: 10.5px; padding: 2px 7px; border-radius: 999px; background: var(--paper-2); color: var(--slate); flex-shrink: 0; }
        .badge { display: inline-flex; align-items: center; font-size: 10.5px; padding: 2px 7px; border-radius: 999px; }
        .badge.pending { background: #FBF0DF; color: var(--brass); }

        .avatar {
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: var(--ink); flex-shrink: 0;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--brass); color: var(--ink); border: none;
          padding: 9px 16px; border-radius: 8px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .btn-primary:hover { filter: brightness(0.95); }
        .btn-primary:disabled { opacity: 0.6; cursor: default; }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
          background: white; color: var(--ink); border: 1px solid var(--line);
          padding: 6px 12px; border-radius: 7px; font: inherit; font-size: 11.5px; font-weight: 600; cursor: pointer;
        }
        .btn-secondary:hover { background: var(--paper-2); }

        .invite-form { display: flex; gap: 8px; }
        .invite-form input {
          flex: 1; border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px;
          font-size: 13px; font-family: var(--font-inter), sans-serif;
        }
        .invite-form input:focus { outline: 2px solid var(--brass); outline-offset: 1px; }
        .form-error { color: var(--rust, #B5502D); font-size: 12.5px; margin: 8px 0 0; }

        .invite-banner {
          display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
          margin-top: 12px; padding: 10px 12px;
          border: 1px solid var(--line); border-radius: 8px; background: var(--paper-2);
          font-size: 12.5px;
        }
        .invite-banner code { font-size: 11.5px; }

        .pending-invites { margin-top: 4px; }

        .success-banner {
          margin-bottom: 20px; padding: 10px 14px;
          border: 1px solid #BFDBC7; border-radius: 8px; background: #EAF5EC;
          color: #2F5233; font-size: 13px; font-weight: 500;
        }
      `}</style>

      <Sidebar />
      <div className="dashboard-main">{children}</div>
    </div>
  );
}
