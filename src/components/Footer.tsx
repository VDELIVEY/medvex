import Link from 'next/link';
import Image from 'next/image';
import { Shield, Activity, Lock, HeartHandshake } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer-modern">
      <div className="container">
        <div className="footer-grid">
          {/* Brand & Overview */}
          <div className="footer-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="nav-brand-mark">
                <Image src="/logo.png" alt="MedQR Logo" width={38} height={38} />
              </span>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', fontFamily: 'Manrope, sans-serif' }}>
                MedQR
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.25rem' }}>
              National Unified Digital Health Infrastructure. Connecting patients, clinical providers, registered medical institutions, and national logistics through encrypted QR records.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
              <Activity size={13} className="pulse" />
              <span>MoH National Network Operational</span>
            </div>
          </div>

          {/* Quick Portals */}
          <div className="footer-section">
            <h3>Staff & Provider Portals</h3>
            <ul className="footer-links-list">
              <li><Link href="/auth/login">Ministry Control Center</Link></li>
              <li><Link href="/auth/login">Institution Admin Portal</Link></li>
              <li><Link href="/auth/login">Doctor Clinical Workspace</Link></li>
              <li><Link href="/auth/login">Reception & Check-In</Link></li>
              <li><Link href="/auth/login">Cashier & CollectUG Billing</Link></li>
              <li><Link href="/auth/login">Pharmacy & Lab Portals</Link></li>
            </ul>
          </div>

          {/* Citizen Services */}
          <div className="footer-section">
            <h3>Citizen & Patient Services</h3>
            <ul className="footer-links-list">
              <li><Link href="/patient-portal/scan">Scan Patient QR Code</Link></li>
              <li><Link href="/auth/login">Medical Records Access</Link></li>
              <li><Link href="/ministry/citizens/qr">Citizen Health ID Lookup</Link></li>
            </ul>
          </div>

          {/* Compliance & Support */}
          <div className="footer-section">
            <h3>Security & Standards</h3>
            <ul className="footer-links-list" style={{ fontSize: '0.85rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>
                <Lock size={14} style={{ color: 'var(--secondary)' }} />
                <span>HMIS / HL7 Compliant</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>
                <Shield size={14} style={{ color: 'var(--primary)' }} />
                <span>Encrypted Patient Data</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>
                <HeartHandshake size={14} style={{ color: '#38bdf8' }} />
                <span>Ministry of Health Approved</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} MedQR Digital Health Platform. Ministry of Health Integrated System.
          </div>
          <div className="flex gap-4">
            <span style={{ fontSize: '0.8rem' }}>Terms of Service</span>
            <span style={{ fontSize: '0.8rem' }}>Privacy & Data Protection</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;