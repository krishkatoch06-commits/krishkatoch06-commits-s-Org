import React, { useEffect, useState } from 'react';
import { X, Check, Users, MapPin, AlertCircle } from 'lucide-react';
import { RestaurantTable } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableSelected?: (table: RestaurantTable) => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({ isOpen, onClose, onTableSelected }) => {
  const { selectedTable, setSelectedTable } = useCart();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  const loadTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTables(true); // active only
      setTables(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load active tables');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFBF7] border border-[#E8E2D8] rounded-2xl w-full max-w-lg p-6 shadow-xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1E1B18]">Select Your Dining Table</h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Choose the table you are currently seated at.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#F3EFEA] hover:text-[#1E1B18] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#78716C]">
              <div className="w-6 h-6 border-2 border-[#E05A47] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Checking active tables...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : tables.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#78716C]">
              No active tables available right now. Please notify the waitstaff.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tables.map(table => {
                const isSelected = selectedTable?.id === table.id;
                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table);
                      if (onTableSelected) onTableSelected(table);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#E05A47] bg-[#E05A47]/5 shadow-xs'
                        : 'border-[#E8E2D8] bg-white hover:border-[#D6CEC1] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#1E1B18]">
                          {table.display_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#78716C] mt-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Seats up to {table.capacity} guests</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#E05A47] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#A8A29E]">
                      <span>Code: {table.qr_code_identifier || `TBL-${table.table_number}`}</span>
                      <span className="text-emerald-700 font-medium">Ready for order</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#78716C]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#E05A47]" />
            Table numbers are strictly verified before order dispatch
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E1B18] text-white hover:bg-black transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
