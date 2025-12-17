import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Category, Product } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    store: '',
    category: Category.ELECTRONICS,
    image: '',
    availableStock: 0,
    inTransitStock: 0,
    plannedShipment: 0,
    salesLast7Days: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
    // Reset form
    setFormData({
      name: '',
      sku: '',
      store: '',
      category: Category.ELECTRONICS,
      image: '',
      availableStock: 0,
      inTransitStock: 0,
      plannedShipment: 0,
      salesLast7Days: 0,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">添加新产品</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">产品名称</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="例如：无线耳机"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="例如：SF-001"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">所属店铺</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="例如：Amazon US"
                value={formData.store}
                onChange={e => setFormData({...formData, store: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">类别</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as Category})}
              >
                {Object.values(Category).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">产品图片</label>
              <div className="flex items-center gap-4">
                {formData.image && (
                   <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-50">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                   </div>
                )}
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageUpload}
                  />
                  <label 
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-blue-400 cursor-pointer transition-all text-sm h-[42px]"
                  >
                    <Upload size={16} />
                    {formData.image ? '更换图片' : '上传本地图片'}
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-100">
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">初始库存数据 (可选)</p>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">可售库存</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.availableStock}
                    onChange={e => setFormData({...formData, availableStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                   <label className="block text-xs text-slate-500 mb-1">7日销量</label>
                   <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={formData.salesLast7Days}
                    onChange={e => setFormData({...formData, salesLast7Days: parseInt(e.target.value) || 0})}
                  />
                </div>
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-all"
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};