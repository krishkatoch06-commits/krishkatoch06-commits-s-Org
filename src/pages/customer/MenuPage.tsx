import React, { useEffect, useState, useMemo } from 'react';
import { Search, Sparkles, Clock, Phone, MapPin, ShoppingBag, Plus, QrCode } from 'lucide-react';
import { MenuItem, MenuCategory } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { DishModal } from '../../components/customer/DishModal';

interface MenuPageProps {
  onNavigate: (path: string) => void;
  onOpenTableModal: () => void;
  onOpenQRModal?: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ onNavigate, onOpenTableModal, onOpenQRModal }) => {
  const { selectedTable, setSelectedTable, totalItemsCount, total, settings } = useCart();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);

  const currencySymbol = settings?.currency_symbol || '₹';

  useEffect(() => {
    loadData();

    // Auto-detect table parameter from QR scan (e.g. ?table=1)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table');
      if (tableParam) {
        api.getTables(true).then(tables => {
          const match = tables.find(t => t.table_number === tableParam || t.id === tableParam);
          if (match) {
            setSelectedTable(match);
          }
        }).catch(() => {});
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsData, itemsData] = await Promise.all([
        api.getCategories(true),
        api.getMenuItems(true)
      ]);
      setCategories(catsData);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      // Veg filter
      if (vegFilter === 'veg' && !item.is_veg) return false;
      if (vegFilter === 'non-veg' && item.is_veg) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.category_name?.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesCategory;
      }
      return true;
    });
  }, [items, selectedCategory, vegFilter, searchQuery]);

  const featuredItems = useMemo(() => {
    return items.filter(i => i.is_featured && i.is_available);
  }, [items]);

  return (
    <div className="min-w-0 pb-28">
      
      {/* Hero Banner */}
      <section className="relative bg-[#1E1B18] text-[#FDFBF7] overflow-hidden">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img
            src={settings?.hero_image_url || '/src/assets/images/hero_restaurant_dining_1793260044497.jpg'}
            alt="Restaurant Dining Ambiance"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-[#E05A47] font-semibold block mb-2">
              QR Dining Experience
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              {settings?.name || 'Demo Restaurant'}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#D6CEC1] leading-relaxed">
              {settings?.description || 'Crafted flavors with farm-fresh organic produce and clay-pot heritage.'}
            </p>

            {/* Restaurant Meta Info */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[#A8A29E]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E05A47]" />
                <span>{settings?.opening_time || '11:00 AM'} – {settings?.closing_time || '11:00 PM'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#E05A47]" />
                <span>{settings?.phone || '+91 98765 43210'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E05A47]" />
                <span className="truncate max-w-[200px]">{settings?.address || 'Indiranagar, Bengaluru'}</span>
              </span>
            </div>

            {/* Actions: Scan QR & Seated Table */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {onOpenQRModal && (
                <button
                  onClick={onOpenQRModal}
                  className="px-4 py-2.5 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code to Order</span>
                </button>
              )}

              <button
                onClick={onOpenTableModal}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#E05A47]" />
                <span>{selectedTable ? `Seated at ${selectedTable.display_name}` : 'Select Seated Table'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Filter & Search Toolbar */}
      <section className="sticky top-16 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E8E2D8] py-3.5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biryani, paneer, naan, desserts..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#E05A47] focus:ring-1 focus:ring-[#E05A47] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#1E1B18]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Veg / Non-Veg Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-[#EFE9DF] rounded-xl self-start sm:self-auto shrink-0">
              <button
                onClick={() => setVegFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  vegFilter === 'all' ? 'bg-white text-[#1E1B18] shadow-xs' : 'text-[#78716C] hover:text-[#1E1B18]'
                }`}
              >
                All Dishes
              </button>
              <button
                onClick={() => setVegFilter('veg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  vegFilter === 'veg' ? 'bg-white text-emerald-800 shadow-xs' : 'text-[#78716C] hover:text-[#1E1B18]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Pure Veg</span>
              </button>
              <button
                onClick={() => setVegFilter('non-veg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  vegFilter === 'non-veg' ? 'bg-white text-red-800 shadow-xs' : 'text-[#78716C] hover:text-[#1E1B18]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>Non-Veg</span>
              </button>
            </div>

          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : 'bg-white border border-[#E8E2D8] text-[#78716C] hover:text-[#1E1B18] hover:border-[#D6CEC1]'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#1E1B18] text-white shadow-xs'
                    : 'bg-white border border-[#E8E2D8] text-[#78716C] hover:text-[#1E1B18] hover:border-[#D6CEC1]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        
        {/* Recommended & Chef Picks (Show when no specific search is active) */}
        {!searchQuery && selectedCategory === 'all' && featuredItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E05A47]" />
              <h2 className="text-xl font-serif font-bold text-[#1E1B18]">Signature & Recommended Dishes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map(item => (
                <div
                  key={'feat-' + item.id}
                  onClick={() => setActiveItem(item)}
                  className="group bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#D6CEC1] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] bg-[#EFE9DF] overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xs border bg-white ${
                        item.is_veg ? 'border-emerald-500' : 'border-red-600'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-mono tabular-nums backdrop-blur-xs">
                      ~{item.prep_time_minutes}m
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-[#78716C] uppercase tracking-wider block">
                        {item.category_name}
                      </span>
                      <h3 className="text-sm font-bold text-[#1E1B18] mt-0.5 line-clamp-1 group-hover:text-[#E05A47] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                      <span className="text-sm font-mono font-bold tabular-nums text-[#1E1B18]">
                        {currencySymbol}{item.price}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveItem(item);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#E05A47]/10 hover:bg-[#E05A47] text-[#E05A47] hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Dishes Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[#1E1B18]">
              {selectedCategory === 'all' ? 'All Dishes' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <span className="text-xs text-[#78716C]">
              Showing {filteredItems.length} dishes
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-[#78716C]">
              <div className="w-8 h-8 border-2 border-[#E05A47] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading restaurant kitchen menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#E8E2D8] bg-white p-8">
              <p className="text-sm font-semibold text-[#1E1B18]">No dishes found</p>
              <p className="text-xs text-[#78716C] mt-1">Try relaxing your search terms or filter selection.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setVegFilter('all');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] text-[#1E1B18] hover:bg-[#F3EFEA]"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="group bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#D6CEC1] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-[#EFE9DF] overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xs border bg-white ${
                        item.is_veg ? 'border-emerald-500' : 'border-red-600'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      </span>
                    </div>
                    {item.prep_time_minutes && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-mono tabular-nums backdrop-blur-xs">
                        ~{item.prep_time_minutes}m
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-[#78716C] uppercase tracking-wider block">
                        {item.category_name}
                      </span>
                      <h3 className="text-sm font-bold text-[#1E1B18] mt-0.5 group-hover:text-[#E05A47] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                      <span className="text-sm font-mono font-bold tabular-nums text-[#1E1B18]">
                        {currencySymbol}{item.price}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveItem(item);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#E05A47]/10 hover:bg-[#E05A47] text-[#E05A47] hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Floating Bottom Cart Bar (capped at 15% mobile viewport) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#1E1B18] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E05A47] flex items-center justify-center font-bold text-sm">
                {totalItemsCount}
              </div>
              <div>
                <span className="text-xs text-[#D6CEC1] block">
                  {selectedTable ? `Table ${selectedTable.table_number}` : 'No table chosen'}
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-white">
                  {currencySymbol}{total} Total
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/cart')}
              className="px-4 py-2.5 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Review Plate & Pay</span>
            </button>
          </div>
        </div>
      )}

      {/* Dish Customization Modal */}
      <DishModal
        item={activeItem}
        isOpen={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        currencySymbol={currencySymbol}
      />

    </div>
  );
};
