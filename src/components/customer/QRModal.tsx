import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Download, Copy, ExternalLink, Check, Smartphone, Utensils } from 'lucide-react';
import { RestaurantTable } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTableAndOrder?: (table: RestaurantTable) => void;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, onSelectTableAndOrder }) => {
  const { settings, selectedTable, setSelectedTable } = useCart();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTableChoice, setSelectedTableChoice] = useState<string>('1'); // 'common' or table_number
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getTables(true).then(data => {
        setTables(data);
        if (selectedTable) {
          setSelectedTableChoice(selectedTable.table_number);
        } else if (data.length > 0) {
          setSelectedTableChoice(data[0].table_number);
        }
      }).catch(() => {});
    }
  }, [isOpen, selectedTable]);

  useEffect(() => {
    if (!isOpen) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let url = `${origin}/menu`;
    if (selectedTableChoice !== 'common') {
      url = `${origin}/menu?table=${selectedTableChoice}`;
    }
    setTargetUrl(url);

    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      color: {
        dark: '#1E1B18',
        light: '#FFFFFF'
      }
    })
      .then(data => setQrDataUrl(data))
      .catch(err => console.error('Failed to generate QR', err));
  }, [isOpen, selectedTableChoice]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `table-${selectedTableChoice}-qr-order.png`;
    a.click();
  };

  const handleSimulateScan = () => {
    if (selectedTableChoice !== 'common') {
      const found = tables.find(t => t.table_number === selectedTableChoice);
      if (found) {
        setSelectedTable(found);
        if (onSelectTableAndOrder) onSelectTableAndOrder(found);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFBF7] border border-[#E8E2D8] rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 relative flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E05A47] text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1E1B18]">Scan to Order from Table</h3>
              <p className="text-xs text-[#78716C]">
                Point your mobile phone camera at this QR code to place an order
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#78716C] hover:bg-[#F3EFEA] hover:text-[#1E1B18] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Selector Pills */}
        <div className="py-4 space-y-2 border-b border-[#E8E2D8]">
          <label className="text-[11px] font-bold text-[#1E1B18] uppercase tracking-wider block">
            Select Dining Table for QR Code:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedTableChoice('common')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTableChoice === 'common'
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : 'bg-white border border-[#E8E2D8] text-[#78716C] hover:border-[#D6CEC1]'
              }`}
            >
              Common Restaurant QR
            </button>
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => setSelectedTableChoice(table.table_number)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTableChoice === table.table_number
                    ? 'bg-[#E05A47] text-white shadow-xs'
                    : 'bg-white border border-[#E8E2D8] text-[#78716C] hover:border-[#D6CEC1]'
                }`}
              >
                Table {table.table_number}
              </button>
            ))}
          </div>
        </div>

        {/* QR Display Card */}
        <div className="py-6 text-center space-y-4">
          <div className="inline-block p-4 bg-white rounded-2xl border-2 border-[#1E1B18] shadow-md relative mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Table QR Code"
                className="w-56 h-56 object-contain mx-auto"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-[#78716C]">
                Generating QR code...
              </div>
            )}

            <div className="mt-2 text-[11px] font-mono font-bold text-[#1E1B18]">
              {selectedTableChoice === 'common'
                ? settings?.name || 'Demo Restaurant'
                : `Table ${selectedTableChoice} · ${settings?.name || 'Demo Restaurant'}`}
            </div>
          </div>

          {/* Quick instructions */}
          <div className="max-w-sm mx-auto text-xs text-[#78716C] flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4 text-[#E05A47] shrink-0" />
            <span>Open your phone camera &amp; scan the code to order right from your seat.</span>
          </div>

          {/* Direct Link box */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-between gap-2 max-w-md mx-auto text-xs">
            <span className="font-mono text-[11px] text-[#78716C] truncate max-w-[280px]">
              {targetUrl}
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-[#F3EFEA] font-semibold text-[#1E1B18] flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl border border-[#E8E2D8] bg-white text-[#1E1B18] hover:bg-[#FAF7F2] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#E05A47]" />
            <span>Download QR PNG</span>
          </button>

          <button
            onClick={handleSimulateScan}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-[#E05A47] hover:bg-[#cb4f3e] text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Test / Open Table Order Here</span>
          </button>
        </div>

      </div>
    </div>
  );
};
