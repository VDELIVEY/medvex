'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '@/lib/context';
import { LogOut, Menu, X, QrCode, User, Building2, LayoutDashboard, Stethoscope, CreditCard, Pill, TestTube2, UserCheck, HelpCircle, Globe, Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const { role, staffName, logout, language, changeLanguage, t } = useApp();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  // Persist dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('medqr_theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('medqr_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('medqr_theme', 'light');
    }
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
  };

  const getNavLinks = () => {
    switch (role) {
      case 'ministry':
        return [
          { href: '/ministry', label: t('dashboard'), icon: LayoutDashboard },
          { href: '/ministry/logistics', label: t('logistics'), icon: Building2 },
          { href: '/ministry/citizens/qr', label: t('qrDirectory'), icon: QrCode },
          { href: '/ministry/register-citizen', label: t('registerCitizen'), icon: UserCheck },
          { href: '/ministry/register-institution', label: t('registerFacility'), icon: Building2 },
        ];
      case 'admin':
        return [
          { href: '/institution', label: t('institutionAdmin'), icon: LayoutDashboard },
          { href: '/institution/register-staff', label: t('registerStaff'), icon: UserCheck },
        ];
      case 'receptionist':
        return [{ href: '/receptionist', label: t('receptionCheckin'), icon: UserCheck }];
      case 'cashier':
        return [{ href: '/cashier', label: t('cashierBilling'), icon: CreditCard }];
      case 'doctor':
        return [{ href: '/doctor', label: t('clinicalWorkspace'), icon: Stethoscope }];
      case 'pharmacy':
        return [{ href: '/pharmacy', label: t('pharmacyDispensing'), icon: Pill }];
      case 'lab':
        return [{ href: '/lab', label: t('labDiagnostics'), icon: TestTube2 }];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <header className="navbar-modern">
      <div className="navbar-inner">
        <Link href="/" className="nav-brand" aria-label="MedQR Home">
          <span className="nav-brand-mark">
            <Image src="/logo.png" alt="MedQR Logo" width={38} height={38} priority />
          </span>
          <span>{t('appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links-desktop" aria-label="Main Navigation">
          <Link
            href="/patient-portal/scan"
            className={`nav-link-item ${pathname === '/patient-portal/scan' ? 'active' : ''}`}
          >
            <QrCode size={15} />
            <span>{t('scanQr')}</span>
          </Link>

          <Link
            href="/faq"
            className={`nav-link-item ${pathname === '/faq' ? 'active' : ''}`}
          >
            <HelpCircle size={15} />
            <span>{t('helpFaq')}</span>
          </Link>

          {/* Language Selector */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(8, 127, 121, 0.08)', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            <Globe size={13} />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as any)}
              style={{ background: 'transparent', border: 'none', fontWeight: 800, color: 'var(--primary-dark)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="en">EN (English)</option>
              <option value="lg">LG (Luganda)</option>
              <option value="sw">SW (Swahili)</option>
              <option value="fr">FR (French)</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: dark ? 'rgba(230, 237, 243, 0.12)' : 'rgba(8, 127, 121, 0.08)',
              border: '1px solid var(--border-color)',
              color: dark ? '#e2c84b' : 'var(--primary-dark)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {role ? (
            <>
              {links.map((link) => {
                const IconComponent = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link-item ${isActive ? 'active' : ''}`}
                  >
                    <IconComponent size={15} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div className="nav-user-badge">
                <User size={13} />
                <span>{staffName || role}</span>
              </div>

              <button
                className="nav-logout-btn"
                onClick={handleLogout}
                title="Log out of your account"
                aria-label="Log out"
              >
                <LogOut size={15} />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="btn btn-primary"
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.875rem' }}
            >
              {t('portalLogin')}
            </Link>
          )}
        </nav>

        {/* Mobile Toggle Button */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav className="nav-mobile-drawer" aria-label="Mobile Navigation">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          </div>

          <Link
            href="/patient-portal/scan"
            className={`nav-link-item ${pathname === '/patient-portal/scan' ? 'active' : ''}`}
            style={{ padding: '0.85rem 1rem', fontSize: '1rem' }}
            onClick={() => setMobileOpen(false)}
          >
            <QrCode size={18} />
            <span>{t('scanQr')}</span>
          </Link>

          {role ? (
            <>
              <div
                className="nav-user-badge"
                style={{ width: 'fit-content', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <User size={16} />
                <span>{staffName || role}</span>
              </div>

              {links.map((link) => {
                const IconComponent = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link-item ${isActive ? 'active' : ''}`}
                    style={{ padding: '0.85rem 1rem', fontSize: '1rem' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <IconComponent size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <button
                className="nav-logout-btn"
                onClick={() => { logout(); setMobileOpen(false); }}
                style={{ padding: '0.85rem 1rem', fontSize: '1rem', width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                <LogOut size={18} />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
              onClick={() => setMobileOpen(false)}
            >
              {t('portalLogin')}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
