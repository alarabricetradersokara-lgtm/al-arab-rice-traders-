import React, { useState } from 'react';
import { RiceProduct, RiceCategory } from '../../types/inventory';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Search, Plus, Sparkles, Filter, Edit2, Trash2 } from 'lucide-react';
import { EditProductModal } from './EditProductModal';
import { inventoryService } from '../../services/inventory.service';

interface ProductListProps {
  products: RiceProduct[];
  categories?: RiceCategory[];
  isLoading: boolean;
  onOpenCreateModal: () => void;
  onSelectProductMovements: (productId: string) => void;
  onRefresh?: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  onOpenCreateModal,
  onSelectProductMovements,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<RiceProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    );
  });

  const formatGrade = (grade: string) => {
    return grade.replace('_', ' ');
  };

  const handleDeleteProduct = async (product: RiceProduct) => {
    if (window.confirm(`کیا آپ واقعی چاول ورائٹی "${product.name}" کو حذف کرنا چاہتے ہیں؟ اس سے وابستہ تمام اسٹاک ریکارڈز بھی ختم ہو جائیں گے۔`)) {
      try {
        setIsDeleting(true);
        await inventoryService.deleteProduct(product.id);
        if (onRefresh) onRefresh();
      } catch (err: any) {
        alert(err.response?.data?.message || err.message || 'چاول حذف کرنے میں غلطی ہوئی۔');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="چاول کے نام یا SKU کوڈ سے تلاش کریں..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F5F7F5] border border-[#E4EAE5] rounded-lg pl-10 pr-4 py-2 text-sm text-[#172B25] focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 focus:border-[#087A55]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[#718078] font-medium hidden sm:block">
            Showing <span className="font-bold text-[#172B25]">{filtered.length}</span> varieties
          </div>
          <Button
            onClick={onOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            variant="primary"
          >
            Register Rice Variety
          </Button>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[11px] font-bold text-[#718078] uppercase tracking-wider">
                <th className="py-3.5 px-4">ورائٹی و SKU کوڈ</th>
                <th className="py-3.5 px-4 text-center">معیاری بوری وزن</th>
                <th className="py-3.5 px-4 text-right">خریداری لاگت / کلو</th>
                <th className="py-3.5 px-4 text-right">فروخت ریٹ / کلو</th>
                <th className="py-3.5 px-4 text-right">دستیاب اسٹاک</th>
                <th className="py-3.5 px-4 text-center">حیثیت</th>
                <th className="py-3.5 px-4 text-right">ایکشنز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#718078]">
                    Loading registered rice products from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#718078]">
                    No rice products match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-[#F5F7F5]/70 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#172B25] group-hover:text-[#087A55] transition-colors">
                        {product.name}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-800">{product.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-num font-medium text-[#172B25]">
                      {product.defaultBagWeightKg} Kg
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num text-[#718078]">
                      PKR {parseFloat(product.costPricePerKg as string).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#087A55]">
                      PKR {parseFloat(product.salePricePerKg as string).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-[#172B25] font-mono-num">
                        {product.totalBags.toLocaleString()} Bags
                      </div>
                      <div className="text-xs text-[#718078] font-mono-num">
                        {parseFloat(product.totalWeightKg).toLocaleString()} Kg ({product.totalMaunds} Mnds)
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {product.isOutOfStock ? (
                        <Badge variant="danger" size="sm">
                          Out of Stock
                        </Badge>
                      ) : product.isLowStock ? (
                        <Badge variant="warning" size="sm">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">
                          Healthy Stock
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ترمیم کریں (Edit)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف کریں (Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectProductMovements(product.id)}
                        >
                          Ledger
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
