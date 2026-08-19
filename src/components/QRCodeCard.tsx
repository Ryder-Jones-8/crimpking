'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Climb } from '@/types';
import { Download, Printer, QrCode } from 'lucide-react';

interface QRCodeCardProps {
  climb: Climb;
  baseUrl?: string;
}

export default function QRCodeCard({ climb, baseUrl }: QRCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');

  useEffect(() => {
    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const url = `${origin}/climb/${climb.qr_code_token}`;
    setTargetUrl(url);

    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [climb, baseUrl]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Tag - ${climb.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f8fafc;
            }
            .tag {
              border: 3px solid #0f172a;
              border-radius: 16px;
              padding: 24px;
              width: 280px;
              text-align: center;
              background: white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .badge {
              display: inline-block;
              background-color: #22c55e;
              color: white;
              padding: 4px 12px;
              border-radius: 9999px;
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 8px;
            }
            .title {
              font-size: 20px;
              font-weight: 800;
              margin: 8px 0 4px 0;
              color: #0f172a;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 16px;
            }
            .qr {
              width: 200px;
              height: 200px;
              margin: 0 auto;
            }
            .scan-text {
              margin-top: 12px;
              font-size: 12px;
              font-weight: 600;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="badge">${climb.gym_grade}</div>
            <div class="title">${climb.name}</div>
            <div class="subtitle">${climb.gym_name || 'Climbing Gym'} • ${climb.wall_name || 'Wall'}</div>
            ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr" />` : ''}
            <div class="scan-text">📷 Scan QR code to rate difficulty & leaves feedback!</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${climb.name.replace(/\s+/g, '-')}-${climb.gym_grade}.png`;
    link.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col items-center shadow-lg hover:border-emerald-500/50 transition">
      <div className="flex items-center justify-between w-full mb-3">
        <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black rounded-full text-sm">
          {climb.gym_grade}
        </span>
        <span className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
          {climb.color} Hold
        </span>
      </div>

      <h3 className="font-bold text-lg text-slate-100 text-center line-clamp-1">{climb.name}</h3>
      <p className="text-xs text-slate-400 text-center mb-4">
        {climb.gym_name} • {climb.wall_name}
      </p>

      <div className="bg-white p-3 rounded-xl shadow-inner mb-4 flex items-center justify-center">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR Code for ${climb.name}`} className="w-44 h-44 object-contain" />
        ) : (
          <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
            <QrCode className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center mb-4 break-all bg-slate-800/80 px-2 py-1 rounded font-mono">
        {targetUrl}
      </p>

      <div className="flex items-center gap-2 w-full">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-lg text-xs font-semibold transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Tag
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-semibold transition border border-slate-700"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}
