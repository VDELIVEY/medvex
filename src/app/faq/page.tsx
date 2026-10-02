'use client';

import React, { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { HelpCircle, ChevronDown, ChevronUp, QrCode, Building2, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/context';

const FAQS = [
  {
    categoryKey: 'categoryCitizens',
    questionKey: 'faqHowToUseCard',
    answerKey: 'faqHowToUseCardAnswer',
  },
  {
    categoryKey: 'categoryCitizens',
    questionKey: 'faqScanNotification',
    answerKey: 'faqScanNotificationAnswer',
  },
  {
    categoryKey: 'categoryCitizens',
    questionKey: 'faqDataProtection',
    answerKey: 'faqDataProtectionAnswer',
  },
  {
    categoryKey: 'categoryClinical',
    questionKey: 'faqPatientRouting',
    answerKey: 'faqPatientRoutingAnswer',
  },
  {
    categoryKey: 'categoryClinical',
    questionKey: 'faqDoctorReferral',
    answerKey: 'faqDoctorReferralAnswer',
  },
  {
    categoryKey: 'categoryInstitutions',
    questionKey: 'faqWhereToSignIn',
    answerKey: 'faqWhereToSignInAnswer',
  },
];

export default function FAQPage() {
  const { t, language } = useApp();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = ['categoryCitizens', 'categoryClinical', 'categoryInstitutions'];
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all' ? FAQS : FAQS.filter(f => f.categoryKey === activeCategory);

  return (
    <div>
      <Breadcrumbs items={[{ label: t('helpFaq') }]} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }} className="fade-in">
        {/* Hero Header */}
        <div style={{
          background: 'linear-gradient(135deg, #087f79 0%, #065f5b 100%)',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          marginBottom: '2.5rem',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -40,
            left: -20,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <HelpCircle style={{ width: 48, height: 48, margin: '0 auto 1rem', opacity: 0.9 }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
              {t('helpFaq')}
            </h1>
            <p style={{ fontSize: '1.05rem', opacity: 0.9, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
              {t('faqSubtitle')}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}>
          {[
            { href: '/patient-portal/scan', label: t('scanQr'), sub: t('openMedicalHistory'), icon: QrCode, color: '#059669' },
            { href: '/auth/login', label: t('clinicalWorkspace'), sub: `${t('doctor')}, ${t('receptionCheckin')}, ${t('labDiagnostics')}`, icon: Stethoscope, color: '#2563eb' },
            { href: '/ministry/login', label: t('dashboard'), sub: t('logistics'), icon: Building2, color: '#7c3aed' },
          ].map((link, i) => (
            <Link
              key={i}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '1rem',
                border: '1px solid rgba(226,232,240,0.9)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '0.75rem',
                background: `${link.color}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: link.color,
                flexShrink: 0,
              }}>
                <link.icon style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{link.label}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{link.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: activeCategory === 'all' ? '#087f79' : '#f1f5f9',
              color: activeCategory === 'all' ? 'white' : '#475569',
            }}
          >
            {t('allTopics')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                background: activeCategory === cat ? '#087f79' : '#f1f5f9',
                color: activeCategory === cat ? 'white' : '#475569',
              }}
            >
              {t(cat)}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '1rem',
                  border: `1px solid ${isOpen ? 'rgba(8,127,121,0.25)' : 'rgba(226,232,240,0.9)'}`,
                  boxShadow: isOpen ? '0 4px 20px rgba(8,127,121,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.background = 'rgba(8,127,121,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#087f79',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.35rem',
                    }}>
                      {t(item.categoryKey)}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
                      {t(item.questionKey)}
                    </h3>
                  </div>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isOpen ? 'rgba(8,127,121,0.1)' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isOpen ? '#087f79' : '#64748b',
                    transition: 'all 0.2s',
                  }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div style={{
                    padding: '0 1.5rem 1.25rem',
                    color: '#334155',
                    lineHeight: 1.7,
                    fontSize: '0.95rem',
                    borderTop: '1px solid #f1f5f9',
                    whiteSpace: 'pre-line',
                  }}>
                    {t(item.answerKey)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
