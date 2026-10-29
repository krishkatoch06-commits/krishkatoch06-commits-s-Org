import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, QrCode, Sparkles, ExternalLink } from 'lucide-react';
import { RestaurantSettings } from '../../types/restaurant';

interface TableQRCardProps {
  settings: RestaurantSettings | null;
}

export const TableQRCard: React.FC<TableQRCardProps> = ({ settings }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // The common QR code points directly to the public /menu URL of this app
  const menuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/menu`
    : 'https://demorestaurant.com/menu';

  useEffect(() => {
    QRCode.toDataURL(menuUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#1E1B18',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation failed', err));
  }, [menuUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `demo-restaurant-common-qr.png`;
    a.click();
  };

  const handlePrintStand = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
      
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE1]">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#1E1B18] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#E05A47]" />
            <span>Common Restaurant Dining QR Code</span>
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            One unified QR code for all tables. Guests scan it to open the digital menu and choose their seated table.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#1E1B18] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handlePrintStand}
            className="px-4 py-2 rounded-xl bg-[#1E1B18] text-white text-xs font-bold hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Table Stand</span>
          </button>
        </div>
      </div>

      {/* Table Tent Stand Preview Card */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
        
        {/* Printable Stand Preview Frame */}
        <div
          ref={printRef}
          className="w-full max-w-sm bg-[#FDFBF7] border-2 border-[#1E1B18] rounded-3xl p-6 text-center space-y-5 shadow-md relative overflow-hidden"
        >
          {/* Decorative Corner Trim */}
          <div className="w-12 h-1 bg-[#E05A47] mx-auto rounded-full" />

          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#E05A47] block">
              WELCOME TO
            </span>
            <h3 className="text-2xl font-serif font-bold text-[#1E1B18] leading-tight">
              {settings?.name || 'Demo Restaurant'}
            </h3>
            <p className="text-xs text-[#78716C]">
              Scan to Browse Menu & Order from Your Table
            </p>
          </div>

          {/* QR Container */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] inline-block shadow-inner mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Common Restaurant QR Code"
                className="w-52 h-52 object-contain mx-auto"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-[#A8A29E]">
                Generating high-res QR...
              </div>
            )}
          </div>

          {/* Table Instruction Steps */}
          <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E8E2D8] text-[11px] text-[#44403C] space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#1E1B18] text-white text-[10px] font-bold flex items-center justify-center">1</span>
              <span>Open your camera or QR scanner app</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#1E1B18] text-white text-[10px] font-bold flex items-center justify-center">2</span>
              <span>Select your table number on screen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#1E1B18] text-white text-[10px] font-bold flex items-center justify-center">3</span>
              <span>Dishes are freshly prepared & brought to you!</span>
            </div>
          </div>

          <div className="text-[10px] text-[#A8A29E] tracking-wider pt-1">
            Payment: Pay at Counter or via UPI / Card
          </div>
        </div>

        {/* Right Info Box */}
        <div className="max-w-md space-y-4 text-xs text-[#78716C]">
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
            <span className="font-bold text-[#1E1B18] block flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E05A47]" />
              Smart Table Selection Architecture
            </span>
            <p className="leading-relaxed">
              Unlike legacy systems that require reprinting unique stickers for every table, this system uses one common QR code pointing directly to your live dining menu (<code className="text-[#E05A47] font-mono text-[11px]">{menuUrl}</code>).
            </p>
            <p className="leading-relaxed">
              Guests simply tap their table number from the list of active tables. Active tables are authoritatively verified by the server before any order is accepted.
            </p>
          </div>

          <a
            href="/menu"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E05A47] hover:underline"
          >
            <span>Preview public menu destination</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

    </div>
  );
};
