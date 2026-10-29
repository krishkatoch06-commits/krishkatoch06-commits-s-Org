import React, { useState } from 'react';
import { X, Plus, Minus, Clock, Check, Utensils } from 'lucide-react';
import { MenuItem, MenuItemVariant, MenuItemAddon } from '../../types/restaurant';
import { useCart } from '../../lib/cart';

interface DishModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const DishModal: React.FC<DishModalProps> = ({ item, isOpen, onClose, currencySymbol = '₹' }) => {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(
    item?.variants && item.variants.length > 0 ? item.variants[0] : undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Sync state when item changes
  React.useEffect(() => {
    if (item) {
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : undefined);
      setSelectedAddons([]);
      setQuantity(1);
      setInstructions('');
      setAddedAnimation(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: MenuItemAddon) => {
    setSelectedAddons(prev => {
      const exists = prev.some(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const handleAddToCart = () => {
    addItem(item, selectedVariant, selectedAddons, quantity, instructions);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDFBF7] border border-[#E8E2D8] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Photo Banner with close button */}
        <div className="relative h-56 sm:h-64 bg-[#EDE8E0] overflow-hidden shrink-0">
          <img
            src={item.image_url}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Dish Badges over photo */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xs border ${
                item.is_veg ? 'border-emerald-500 bg-white' : 'border-red-600 bg-white'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                {item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-white/80">
              <Clock className="w-3.5 h-3.5" />
              <span>~{item.prep_time_minutes} mins</span>
            </div>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1E1B18]">{item.name}</h2>
            <p className="text-xs text-[#78716C] mt-1 leading-relaxed">{item.description}</p>
          </div>

          {/* Variants Selection */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
              <label className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider block">
                Choose Portion / Size <span className="text-[#E05A47]">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {item.variants.map(variant => {
                  const isChecked = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={!variant.is_available}
                      onClick={() => setSelectedVariant(variant)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                        isChecked
                          ? 'border-[#E05A47] bg-[#E05A47]/5 text-[#1E1B18]'
                          : 'border-[#E8E2D8] bg-white text-[#44403C] hover:border-[#D6CEC1]'
                      } ${!variant.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isChecked ? 'border-[#E05A47]' : 'border-[#A8A29E]'
                        }`}>
                          {isChecked && <div className="w-2 h-2 rounded-full bg-[#E05A47]" />}
                        </div>
                        <span>{variant.name}</span>
                      </div>
                      <span className="font-mono font-semibold tabular-nums text-[#1E1B18]">
                        {currencySymbol}{variant.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Selection */}
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
              <label className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider block">
                Recommended Add-ons & Accompaniments
              </label>
              <div className="grid grid-cols-1 gap-2">
                {item.addons.map(addon => {
                  const isChecked = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      disabled={!addon.is_available}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                        isChecked
                          ? 'border-[#E05A47] bg-[#E05A47]/5 text-[#1E1B18]'
                          : 'border-[#E8E2D8] bg-white text-[#44403C] hover:border-[#D6CEC1]'
                      } ${!addon.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isChecked ? 'border-[#E05A47] bg-[#E05A47] text-white' : 'border-[#A8A29E] bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="font-mono tabular-nums text-[#78716C]">
                        +{currencySymbol}{addon.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-1.5 pt-2 border-t border-[#E8E2D8]">
            <label className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider block">
              Chef Special Instructions
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Mild spice, less oil, no onion, extra crisp..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none focus:border-[#E05A47] focus:ring-1 focus:ring-[#E05A47]"
              maxLength={120}
            />
          </div>
        </div>

        {/* Footer Actions with Price & Quantity Stepper */}
        <div className="p-4 border-t border-[#E8E2D8] bg-white flex items-center justify-between gap-4 shrink-0">
          
          {/* Quantity Stepper */}
          <div className="flex items-center border border-[#E8E2D8] rounded-xl bg-[#FAF7F2] p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#44403C] hover:bg-white disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold font-mono tabular-nums text-[#1E1B18]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#44403C] hover:bg-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleAddToCart}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
              addedAnimation ? 'bg-emerald-600 scale-[0.98]' : 'bg-[#E05A47] hover:bg-[#cb4f3e]'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Added to Plate</span>
              </>
            ) : (
              <>
                <Utensils className="w-4 h-4" />
                <span>Add to Plate · {currencySymbol}{totalPrice}</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
