import { useEffect, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import KPICards from '../components/dashboard/KPICards';
import DefectTrendChart from '../components/dashboard/DefectTrendChart';
import SupplierRankChart from '../components/dashboard/SupplierRankChart';
import { defectsApi } from '../api/defects';
import { ncrApi } from '../api/ncr';
import { capaApi } from '../api/capa';
import { suppliersApi } from '../api/suppliers';
import { daysOverdue } from '../utils/formatDate';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, trend: [] });
  const [openNCRs, setOpenNCRs] = useState(0);
  const [overdueCAPAs, setOverdueCAPAs] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [defectStats, ncrRes, capaRes, supRes] = await Promise.all([
          defectsApi.stats(),
          ncrApi.list({ limit: 100 }),
          capaApi.list({ limit: 100 }),
          suppliersApi.list(),
        ]);
        if (!active) return;
        setStats(defectStats.data);
        setOpenNCRs((ncrRes.data || []).filter((n) => n.status !== 'closed').length);
        setOverdueCAPAs(
          (capaRes.data || []).filter((c) => {
            const od = daysOverdue(c.target_date);
            return od != null && od > 0 && c.status !== 'closed' && c.status !== 'verified';
          }).length
        );
        setSuppliers(supRes.data || []);
      } catch {
        // The cold-start banner in App handles connection-level errors.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const avgScore = suppliers.length
    ? suppliers.reduce((s, x) => s + Number(x.quality_score), 0) / suppliers.length
    : 0;

  return (
    <PageWrapper title="Dashboard" subtitle="Quality at a glance across all modules">
      {loading ? (
        <div className="card p-8 text-center text-gray-400">Loading dashboard…</div>
      ) : (
        <div className="space-y-6">
          <KPICards
            totalDefects={stats.total}
            openNCRs={openNCRs}
            overdueCAPAs={overdueCAPAs}
            avgScore={avgScore}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DefectTrendChart trend={stats.trend} />
            <SupplierRankChart suppliers={suppliers} />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
