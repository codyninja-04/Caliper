import { useEffect, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import CAPABoard from '../components/capa/CAPABoard';
import CAPAForm from '../components/capa/CAPAForm';
import { capaApi } from '../api/capa';
import { ncrApi } from '../api/ncr';
import { useAuth } from '../context/AuthContext';

const WRITERS = ['quality_engineer', 'supervisor', 'admin'];

export default function CAPA() {
  const { role } = useAuth();
  const canWrite = WRITERS.includes(role);

  const [capas, setCapas] = useState([]);
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await capaApi.list({ limit: 100 });
      setCapas(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    ncrApi.list({ limit: 100 }).then((r) => setNcrs(r.data || [])).catch(() => {});
  }, []);

  const handleMove = async (capa, status) => {
    // Optimistic update; revert on failure.
    const prev = capas;
    setCapas((cs) => cs.map((c) => (c.id === capa.id ? { ...c, status } : c)));
    try {
      if (status === 'verified') {
        // Verification requires an effectiveness score.
        const scoreStr = window.prompt('Effectiveness score (1–10)?', '8');
        const score = Number(scoreStr);
        if (!score || score < 1 || score > 10) {
          setCapas(prev);
          return;
        }
        await capaApi.verify(capa.id, { effectiveness_score: score });
      } else {
        await capaApi.update(capa.id, { status });
      }
      await load();
    } catch (err) {
      setError(err.message);
      setCapas(prev);
    }
  };

  const handleCreate = async (payload) => {
    await capaApi.create(payload);
    await load();
  };

  return (
    <PageWrapper
      title="CAPA"
      subtitle="Corrective &amp; preventive actions — drag cards to advance the lifecycle"
      actions={canWrite && <button className="btn-primary" onClick={() => setFormOpen(true)}>+ Open CAPA</button>}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <CAPABoard capas={capas} loading={loading} onMove={handleMove} />

      <CAPAForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} ncrs={ncrs} />
    </PageWrapper>
  );
}
