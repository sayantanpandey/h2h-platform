'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { buildInvoiceHtml } from '@/lib/invoice';

interface InvoiceDownloadProps {
  appointmentId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function InvoiceDownload({
  appointmentId,
  variant = 'outline',
  size = 'default',
  className = '',
}: InvoiceDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/invoices/${appointmentId}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch invoice data');
      }

      const html = buildInvoiceHtml(data.data);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow popups to download the invoice');
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate invoice';
      setError(message);
      console.error('Invoice generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </>
        )}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
