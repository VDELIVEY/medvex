'use client';

import React, { useEffect, useState } from 'react';

type Props = {
  institutionId: string | null;
  staffId: string | null;
  onSelect: (episode: any) => void;
  onSearchEpisode: (e: React.FormEvent) => void;
  episodeCode: string;
  setEpisodeCode: (v: string) => void;
  loading: boolean;
};

export default function DoctorEpisodesTable({
  institutionId,
  staffId,
  onSelect,
  onSearchEpisode,
  episodeCode,
  setEpisodeCode,
  loading,
}: Props) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [filterMode, setFilterMode] = useState<'mine' | 'all'>('mine');

  useEffect(() => {
    let cancelled = false;

    async function loadToday() {
      try {
        setLoadingEpisodes(true);
        const params = new URLSearchParams();
        params.set('date', 'today');
        if (institutionId) params.set('institutionId', institutionId);
        // Filter by assigned doctor when in "mine" mode
        if (filterMode === 'mine' && staffId) params.set('assignedDoctorId', staffId);

        const res = await fetch(`/api/episodes?${params.toString()}`);
        const json = await res.json();
        if (!cancelled && res.ok && Array.isArray(json.episodes)) {
          setEpisodes(json.episodes);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingEpisodes(false);
      }
    }

    loadToday();
    return () => {
      cancelled = true;
    };
  }, [institutionId, staffId, filterMode]);

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="mb-2">Consultation Room</h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Select today’s episode from the table or enter an episode code.
        </p>
      </div>

      <div className="glass-card p-10 max-w-2xl mx-auto shadow-2xl mb-8">
        <form onSubmit={onSearchEpisode}>
          <div className="form-group">
            <label className="form-label">Clinical Episode Code</label>
            <input
              type="text"
              placeholder="E.g., EP-7XY2B"
              value={episodeCode}
              onChange={(e) => setEpisodeCode(e.target.value.toUpperCase())}
              required
              className="input-modern text-2xl font-black font-mono text-center tracking-[0.2em] py-8 border-2 border-dashed border-gray-200"
            />
          </div>
          <button
            type="submit"
            className="w-full btn btn-primary py-5 mt-6 font-bold flex items-center justify-center gap-3"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Access Patient Record'}
          </button>
        </form>
      </div>

      <div className="glass-card p-10 max-w-4xl mx-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-3">Today’s Episodes</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilterMode('mine')}
              className="btn"
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.8rem',
                background: filterMode === 'mine' ? 'var(--primary)' : 'rgba(8,127,121,0.08)',
                color: filterMode === 'mine' ? 'white' : 'var(--primary-dark)',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              My Queue
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className="btn"
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.8rem',
                background: filterMode === 'all' ? 'var(--primary)' : 'rgba(8,127,121,0.08)',
                color: filterMode === 'all' ? 'white' : 'var(--primary-dark)',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              All Episodes
            </button>
          </div>
        </div>

        <div className="text-muted text-sm mb-4">
          {loadingEpisodes ? 'Loading...' : `${episodes.length} found`}
          {filterMode === 'mine' && staffId ? ' — filtered to your assigned queue' : ''}
        </div>

        {loadingEpisodes ? (
          <div className="py-10 text-center text-muted">Loading episodes...</div>
        ) : episodes.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-3xl text-muted">
            {filterMode === 'mine' ? 'No episodes assigned to you today.' : 'No episodes today.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    Episode Code
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    Patient
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    Gender
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    Status
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((ep: any) => (
                  <tr key={ep.id}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
                      {ep.episode_code}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
                      {ep.patients?.first_name} {ep.patients?.last_name}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
                      {ep.patients?.gender}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
                      {ep.status}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', minHeight: 36 }}
                        onClick={() => onSelect(ep)}
                      >
                        Continue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}