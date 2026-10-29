import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Copy,
  Layers,
  Utensils
} from 'lucide-react';
import { MenuItem, MenuCategory, MenuItemVariant, MenuItemAddon } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth';

export const AdminMenuPage: React.FC = () => {
  const { settings } = useCart();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Item Form Modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [itemFormData, setItemFormData] = useState<any>({
    name: '',
    category_id: '',
    price: '',
    description: '',
    image_url: '/src/assets/images/food_butter_chicken_1793260045350.jpg',
    is_veg: true,
    is_available: true,
    is_featured: false,
    prep_time_minutes: 20,
    variants: [] as { name: string; price: number }[],
    addons: [] as { name: string; price: number }[]
  });

  // Category Modal
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 1
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const currencySymbol = settings?.currency_symbol || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, itms] = await Promise.all([
        api.getCategories(false),
        api.getMenuItems(false)
      ]);
      setCategories(cats);
      setItems(itms);
      if (cats.length > 0 && !itemFormData.category_id) {
        setItemFormData((prev: any) => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewItemModal = () => {
    setEditingItem(null);
    setItemFormData({
      name: '',
      category_id: categories[0]?.id || '',
      price: '',
      description: '',
      image_url: '/src/assets/images/food_butter_chicken_1793260045350.jpg',
      is_veg: true,
      is_available: true,
      is_featured: false,
      prep_time_minutes: 20,
      variants: [],
      addons: []
    });
    setFormError(null);
    setIsNewItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      category_id: item.category_id,
      price: item.price,
      description: item.description,
      image_url: item.image_url,
      is_veg: item.is_veg,
      is_available: item.is_available,
      is_featured: item.is_featured,
      prep_time_minutes: item.prep_time_minutes,
      variants: item.variants ? item.variants.map(v => ({ id: v.id, name: v.name, price: v.price })) : [],
      addons: item.addons ? item.addons.map(a => ({ id: a.id, name: a.name, price: a.price })) : []
    });
    setFormError(null);
    setIsNewItemModalOpen(true);
  };

  const handleDuplicateItem = (item: MenuItem) => {
    setEditingItem(null);
    setItemFormData({
      name: `${item.name} (Copy)`,
      category_id: item.category_id,
      price: item.price,
      description: item.description,
      image_url: item.image_url,
      is_veg: item.is_veg,
      is_available: true,
      is_featured: false,
      prep_time_minutes: item.prep_time_minutes,
      variants: item.variants ? item.variants.map(v => ({ name: v.name, price: v.price })) : [],
      addons: item.addons ? item.addons.map(a => ({ name: a.name, price: a.price })) : []
    });
    setFormError(null);
    setIsNewItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!itemFormData.name || !itemFormData.price) {
      setFormError('Item name and price are required');
      return;
    }

    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem.id, itemFormData, user?.full_name);
      } else {
        await api.createMenuItem(itemFormData, user?.full_name);
      }
      setIsNewItemModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? Past order receipts will remain intact.`)) return;
    try {
      await api.deleteMenuItem(item.id, user?.full_name);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      await api.updateMenuItem(item.id, { is_available: !item.is_available }, user?.full_name);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !item.is_available } : i));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const handleBulkToggle = async (isAvailable: boolean) => {
    if (selectedItemIds.length === 0) return;
    try {
      await api.bulkToggleItemsAvailability(selectedItemIds, isAvailable);
      setSelectedItemIds([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Bulk update failed');
    }
  };

  // Category Actions
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      image_url: '',
      display_order: categories.length + 1
    });
    setFormError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      description: cat.description || '',
      image_url: cat.image_url || '',
      display_order: cat.display_order
    });
    setFormError(null);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!categoryFormData.name) {
      setFormError('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryFormData, user?.full_name);
      } else {
        await api.createCategory(categoryFormData, user?.full_name);
      }
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (cat: MenuCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await api.deleteCategory(cat.id, user?.full_name);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  // Filter items
  const filteredItems = items.filter(i => {
    if (selectedCategoryFilter !== 'all' && i.category_id !== selectedCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Catalog Management
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Menu & Categories</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E8E2D8] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'items' ? 'bg-[#1E1B18] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1E1B18]'
            }`}
          >
            Dishes ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'categories' ? 'bg-[#1E1B18] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1E1B18]'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {activeTab === 'items' && (
        <div className="space-y-4">
          
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none focus:border-[#E05A47]"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {selectedItemIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleBulkToggle(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  >
                    Mark Available ({selectedItemIds.length})
                  </button>
                  <button
                    onClick={() => handleBulkToggle(false)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  >
                    Mark Sold Out
                  </button>
                </div>
              )}

              <button
                onClick={openNewItemModal}
                className="px-4 py-2 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dish</span>
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-20 text-center text-xs text-[#78716C]">Loading dishes...</div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#78716C]">No dishes found matching criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[#78716C] font-semibold">
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.length === filteredItems.length && filteredItems.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedItemIds(filteredItems.map(i => i.id));
                            else setSelectedItemIds([]);
                          }}
                        />
                      </th>
                      <th className="p-3">Dish</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Variants & Addons</th>
                      <th className="p-3 text-center">Diet</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE1]">
                    {filteredItems.map(item => {
                      const isSelected = selectedItemIds.includes(item.id);

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedItemIds(prev => [...prev, item.id]);
                                else setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                              }}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover bg-[#EFE9DF] shrink-0"
                              />
                              <div>
                                <span className="font-bold text-[#1E1B18] block flex items-center gap-1.5">
                                  {item.name}
                                  {item.is_featured && (
                                    <span title="Featured signature dish">
                                      <Sparkles className="w-3 h-3 text-[#E05A47]" />
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-[#78716C] line-clamp-1 max-w-xs">{item.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-[#78716C]">{item.category_name}</td>
                          <td className="p-3 font-mono font-bold text-[#1E1B18] tabular-nums">
                            {currencySymbol}{item.price}
                          </td>
                          <td className="p-3 text-[11px] text-[#78716C]">
                            {item.variants && item.variants.length > 0 && <span>{item.variants.length} sizes</span>}
                            {item.variants && item.variants.length > 0 && item.addons && item.addons.length > 0 && <span> · </span>}
                            {item.addons && item.addons.length > 0 && <span>{item.addons.length} add-ons</span>}
                            {(!item.variants?.length && !item.addons?.length) && <span className="text-[#A8A29E]">Standard</span>}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.is_veg ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {item.is_veg ? 'VEG' : 'NON-VEG'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleItemAvailability(item)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                                item.is_available
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {item.is_available ? 'Available' : 'Sold Out'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDuplicateItem(item)}
                                title="Duplicate Dish"
                                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditItemModal(item)}
                                title="Edit Dish"
                                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                title="Delete Dish"
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openNewCategoryModal}
              className="px-4 py-2 rounded-xl bg-[#E05A47] text-white text-xs font-bold hover:bg-[#cb4f3e] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center font-bold text-xs text-[#E05A47]">
                      {cat.display_order}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1E1B18] text-sm">{cat.name}</h3>
                      <span className="text-[11px] text-[#78716C]">{cat.item_count || 0} dishes</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditCategoryModal(cat)}
                      className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#FAF7F2]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#78716C] line-clamp-2">{cat.description || 'No description provided.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dish Modal (Add / Edit) */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
            
            <div className="flex items-center justify-between p-5 border-b border-[#E8E2D8]">
              <h2 className="text-base font-bold text-[#1E1B18]">
                {editingItem ? 'Edit Dish' : 'Add New Dish to Menu'}
              </h2>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1 rounded-lg text-[#78716C] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#1E1B18] block mb-1">Dish Name *</label>
                  <input
                    type="text"
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    placeholder="e.g. Saffron Dum Gosht Biryani"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#E05A47]"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1E1B18] block mb-1">Category *</label>
                  <select
                    value={itemFormData.category_id}
                    onChange={(e) => setItemFormData({ ...itemFormData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none"
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-[#1E1B18] block mb-1">Base Price ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.price}
                    onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                    placeholder="340"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1E1B18] block mb-1">Estimated Prep Time (mins)</label>
                  <input
                    type="number"
                    value={itemFormData.prep_time_minutes}
                    onChange={(e) => setItemFormData({ ...itemFormData, prep_time_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1E1B18] block mb-1">Diet Classification</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="diet"
                        checked={itemFormData.is_veg === true}
                        onChange={() => setItemFormData({ ...itemFormData, is_veg: true })}
                      />
                      <span>Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="diet"
                        checked={itemFormData.is_veg === false}
                        onChange={() => setItemFormData({ ...itemFormData, is_veg: false })}
                      />
                      <span>Non-Veg</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1E1B18] block mb-1">Image URL</label>
                <input
                  type="text"
                  value={itemFormData.image_url}
                  onChange={(e) => setItemFormData({ ...itemFormData, image_url: e.target.value })}
                  placeholder="/src/assets/images/food_butter_chicken_1793260045350.jpg"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1E1B18] block mb-1">Description</label>
                <textarea
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  rows={2}
                  placeholder="Ingredients, culinary notes, and spices..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFormData.is_available}
                    onChange={(e) => setItemFormData({ ...itemFormData, is_available: e.target.checked })}
                  />
                  <span className="font-semibold">Available for Ordering</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFormData.is_featured}
                    onChange={(e) => setItemFormData({ ...itemFormData, is_featured: e.target.checked })}
                  />
                  <span className="font-semibold">Featured Signature Dish</span>
                </label>
              </div>

              {/* Variants Builder */}
              <div className="pt-3 border-t border-[#E8E2D8] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E1B18] uppercase tracking-wider text-[11px]">
                    Portion Sizes / Variants
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setItemFormData({
                        ...itemFormData,
                        variants: [...itemFormData.variants, { name: 'Full Plate', price: Number(itemFormData.price) || 0 }]
                      });
                    }}
                    className="text-[11px] font-bold text-[#E05A47] hover:underline"
                  >
                    + Add Variant
                  </button>
                </div>

                {itemFormData.variants.map((v: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const next = [...itemFormData.variants];
                        next[idx].name = e.target.value;
                        setItemFormData({ ...itemFormData, variants: next });
                      }}
                      placeholder="Size label (e.g. Platter)"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#E8E2D8]"
                    />
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => {
                        const next = [...itemFormData.variants];
                        next[idx].price = Number(e.target.value);
                        setItemFormData({ ...itemFormData, variants: next });
                      }}
                      placeholder="Price"
                      className="w-24 px-3 py-1.5 rounded-lg border border-[#E8E2D8]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = itemFormData.variants.filter((_: any, i: number) => i !== idx);
                        setItemFormData({ ...itemFormData, variants: next });
                      }}
                      className="p-1 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add-ons Builder */}
              <div className="pt-3 border-t border-[#E8E2D8] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E1B18] uppercase tracking-wider text-[11px]">
                    Recommended Add-ons
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setItemFormData({
                        ...itemFormData,
                        addons: [...itemFormData.addons, { name: 'Extra Butter Naan', price: 60 }]
                      });
                    }}
                    className="text-[11px] font-bold text-[#E05A47] hover:underline"
                  >
                    + Add Add-on
                  </button>
                </div>

                {itemFormData.addons.map((a: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => {
                        const next = [...itemFormData.addons];
                        next[idx].name = e.target.value;
                        setItemFormData({ ...itemFormData, addons: next });
                      }}
                      placeholder="Add-on name"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#E8E2D8]"
                    />
                    <input
                      type="number"
                      value={a.price}
                      onChange={(e) => {
                        const next = [...itemFormData.addons];
                        next[idx].price = Number(e.target.value);
                        setItemFormData({ ...itemFormData, addons: next });
                      }}
                      placeholder="Price"
                      className="w-24 px-3 py-1.5 rounded-lg border border-[#E8E2D8]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = itemFormData.addons.filter((_: any, i: number) => i !== idx);
                        setItemFormData({ ...itemFormData, addons: next });
                      }}
                      className="p-1 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] font-semibold text-[#1E1B18]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E05A47] text-white font-bold hover:bg-[#cb4f3e]"
                >
                  Save Dish
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Category Modal (Add / Edit) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-[#1E1B18]">
              {editingCategory ? 'Edit Category' : 'Create Menu Category'}
            </h2>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Clay Pot Specialties"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryFormData.display_order}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, display_order: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E05A47] text-white font-bold hover:bg-[#cb4f3e]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
