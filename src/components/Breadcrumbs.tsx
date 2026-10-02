'use client';

import Link from 'next/link';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
}

export default function Breadcrumbs({ items, backHref, backLabel = 'Back' }: BreadcrumbsProps) {
  return (
    <div className="breadcrumb-wrapper">
      <div className="breadcrumb-container">
        {backHref && (
          <Link href={backHref} className="breadcrumb-back-btn" aria-label={`Go back to ${backLabel}`}>
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </Link>
        )}

        <nav aria-label="Breadcrumb" className="breadcrumb-nav">
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link href="/" className="breadcrumb-link home-link" aria-label="Go to Home">
                <Home size={14} />
                <span className="sr-only">Home</span>
              </Link>
            </li>

            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <li key={index} className="breadcrumb-item">
                  <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
                  {isLast || !item.href ? (
                    <span className="breadcrumb-current" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <Link href={item.href} className="breadcrumb-link">
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
