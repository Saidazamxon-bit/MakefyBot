import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';

export default function Home() {
  const { user, updateBalance } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get('/home.php')
      .then((d) => {
        if (!alive) return;
        setData(d);
        updateBalance(d.balance);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-danger text-sm">{error}</p>;
  if (!data) return <HomeSkeleton />;

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-xl)] bg-gradient-to-br from-surface-2 to-surface p-5 border border-border">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wide">Balansingiz</div>
        <div className="text-3xl font-extrabold mt-1">{formatMoney(data.balance)}</div>
        {data.dailyBonus > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-accent bg-accent-soft px-2.5 py-1 rounded-full">
            <i className="fa-solid fa-gift" /> Bugungi bonus: +{formatMoney(data.dailyBonus)}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Link
            to="/deposit"
            className="flex-1 text-center py-2.5 rounded-[var(--radius-md)] bg-surface-3 border border-border font-bold text-sm"
          >
            <i className="fa-solid fa-wallet mr-1.5" /> To'ldirish
          </Link>
          <Link
            to="/create"
            className="flex-1 text-center py-2.5 rounded-[var(--radius-md)] bg-gradient-to-r from-accent to-accent-dim text-accent-text font-bold text-sm"
          >
            <i className="fa-solid fa-plus mr-1.5" /> Bot yaratish
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-[15px]">Botlaringiz ({data.botsCount})</h3>
          <Link to="/bots" className="text-[12.5px] font-bold text-accent-dim">
            Barchasi →
          </Link>
        </div>
        {data.botsCount === 0 ? (
          <EmptyCard
            icon="fa-robot"
            text="Hali botingiz yo'q"
            action={
              <Link to="/create" className="text-accent font-bold text-sm">
                Birinchi botingizni yarating →
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {data.botsPreview.map((b) => (
              <Link
                key={b.username}
                to={`/bots/${b.username}`}
                className="flex items-center gap-3 bg-surface border border-border rounded-[var(--radius-md)] px-3.5 py-3"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${b.faol ? 'bg-accent' : 'bg-text-dim'}`}
                />
                <span className="font-semibold text-sm flex-1 truncate">@{b.username}</span>
                <i className="fa-solid fa-chevron-right text-text-dim text-xs" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/referal"
          className="rounded-[var(--radius-md)] bg-surface border border-border p-4"
        >
          <i className="fa-solid fa-users text-info text-lg" />
          <div className="text-xl font-extrabold mt-1.5">{data.referral.count}</div>
          <div className="text-[12px] text-text-muted font-semibold">Taklif qilinganlar</div>
        </Link>
        <Link
          to="/vazifalar"
          className="rounded-[var(--radius-md)] bg-surface border border-border p-4"
        >
          <i className="fa-solid fa-coins text-warn text-lg" />
          <div className="text-xl font-extrabold mt-1.5">{formatMoney(data.referral.bonus)}</div>
          <div className="text-[12px] text-text-muted font-semibold">Referaldan daromad</div>
        </Link>
      </section>

      <section>
        <h3 className="font-extrabold text-[15px] mb-2">Balans reytingi</h3>
        <div className="rounded-[var(--radius-md)] bg-surface border border-border overflow-hidden">
          {data.leaderboard.top.map((row) => (
            <div
              key={row.user_id}
              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm ${
                row.user_id === user?.user_id ? 'bg-accent-soft' : ''
              } [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border`}
            >
              <span className="w-5 text-center font-bold text-text-muted">{row.rank}</span>
              <span className="flex-1 font-semibold truncate">{row.login}</span>
              <span className="font-bold">{formatMoney(row.value)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyCard({ icon, text, action }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-surface border border-dashed border-border-light p-6 text-center">
      <i className={`fa-solid ${icon} text-2xl text-text-dim`} />
      <p className="text-sm text-text-muted mt-2 mb-1">{text}</p>
      {action}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-32 rounded-[var(--radius-xl)] bg-surface-2" />
      <div className="h-24 rounded-[var(--radius-md)] bg-surface-2" />
      <div className="h-24 rounded-[var(--radius-md)] bg-surface-2" />
    </div>
  );
}
