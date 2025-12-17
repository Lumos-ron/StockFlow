import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Loader2, Package, Layers, Settings2, CheckSquare, Square } from 'lucide-react';
import { Product } from '../types';
import html2canvas from 'html2canvas';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onUpdateProduct: (id: string, field: keyof Product, value: number | string) => void;
  calculations: Map<string, any>;
}

export const RestockModal: React.FC<RestockModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedProducts,
  onUpdateProduct,
  calculations
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Local selection for bulk operations within the modal
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());

  // Bulk Edit States
  const [bulkQtyPerCarton, setBulkQtyPerCarton] = useState<string>('');
  const [bulkSpecs, setBulkSpecs] = useState<string>('');

  // Initialize selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(new Set(selectedProducts.map(p => p.id)));
    }
  }, [isOpen, selectedProducts.length]);

  if (!isOpen) return null;

  // Calculate totals for footer
  const summary = selectedProducts.reduce((acc, p) => {
    const calc = calculations.get(p.id);
    const qty = p.customRestockQty !== undefined ? p.customRestockQty : (calc?.restockNeededQty || 0);
    const perCarton = p.qtyPerCarton || 0;
    const cartons = perCarton > 0 ? Math.ceil(qty / perCarton) : 0;
    
    return {
      totalQty: acc.totalQty + qty,
      totalCartons: acc.totalCartons + cartons
    };
  }, { totalQty: 0, totalCartons: 0 });

  const currentDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const handleDownload = async () => {
    if (!tableRef.current) return;
    setIsGenerating(true);
    
    // Wait for React to render the "text-only" view before capturing
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(tableRef.current!, {
          scale: 2,
          backgroundColor: '#ffffff', // Ensure white background
          useCORS: true,
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `StockFlow_补货单_${currentDate.replace(/\//g, '-')}.png`;
        link.click();
      } catch (err) {
        console.error("Failed to generate image", err);
        alert("生成图片失败，请重试");
      } finally {
        setIsGenerating(false);
      }
    }, 200);
  };

  const toggleSelectAll = () => {
    if (localSelectedIds.size === selectedProducts.length) {
      setLocalSelectedIds(new Set());
    } else {
      setLocalSelectedIds(new Set(selectedProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setLocalSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const applyBulkQtyPerCarton = () => {
    const val = parseInt(bulkQtyPerCarton);
    if (!isNaN(val) && val > 0) {
      selectedProducts.forEach(p => {
        if (localSelectedIds.has(p.id)) {
          onUpdateProduct(p.id, 'qtyPerCarton', val);
        }
      });
    }
  };

  const applyBulkSpecs = () => {
    if (bulkSpecs.trim()) {
      selectedProducts.forEach(p => {
        if (localSelectedIds.has(p.id)) {
          onUpdateProduct(p.id, 'specs', bulkSpecs);
        }
      });
    }
  };

  const isAllSelected = selectedProducts.length > 0 && localSelectedIds.size === selectedProducts.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="text-blue-600" />
              安排补货预览
            </h3>
            <p className="text-sm text-slate-500 mt-1">请核对补货数量及装箱规格，确认无误后导出图片。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Bulk Actions Toolbar */}
        <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center gap-6 flex-wrap shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Settings2 size={16} />
            批量修改 <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs">选中的 {localSelectedIds.size} 项</span> :
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="统一规格 (如 90x120)" 
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-40 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={bulkSpecs}
              onChange={(e) => setBulkSpecs(e.target.value)}
            />
            <button 
              onClick={applyBulkSpecs}
              disabled={localSelectedIds.size === 0}
              className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              应用
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="统一装箱数" 
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={bulkQtyPerCarton}
              onChange={(e) => setBulkQtyPerCarton(e.target.value)}
            />
            <button 
              onClick={applyBulkQtyPerCarton}
              disabled={localSelectedIds.size === 0}
              className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              应用
            </button>
          </div>
        </div>
        
        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-100/50">
          {/* This represents the paper/image to be exported */}
          <div className="w-full max-w-4xl shadow-xl">
            <div 
              ref={tableRef} 
              className="bg-white p-8 rounded-none text-slate-800"
              style={{ minHeight: '800px' }}
            >
              {/* Export Header */}
              <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                      S
                    </div>
                    StockFlow 补货单
                  </h1>
                  <p className="text-slate-500 mt-2 text-sm font-medium">日期: {currentDate}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">总计箱数</div>
                  <div className="text-4xl font-bold text-blue-600 leading-none mt-1">{summary.totalCartons}</div>
                </div>
              </div>
              
              {/* Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    {/* Checkbox Column - Hidden in Export */}
                    <th className="py-3 px-2 w-10 text-center" data-html2canvas-ignore="true">
                      <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600">
                         {isAllSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                      </button>
                    </th>
                    <th className="py-3 px-2 font-semibold">SKU / 产品</th>
                    <th className="py-3 px-2 font-semibold w-24 text-center">图片</th>
                    <th className="py-3 px-2 font-semibold w-32 text-center">规格/尺寸</th>
                    <th className="py-3 px-2 font-semibold w-28 text-center text-blue-600">补货数量</th>
                    <th className="py-3 px-2 font-semibold w-28 text-center">装箱数 (个/箱)</th>
                    <th className="py-3 px-2 font-semibold w-24 text-center">总箱数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {selectedProducts.map((p, index) => {
                    const calc = calculations.get(p.id);
                    const finalQty = p.customRestockQty !== undefined ? p.customRestockQty : (calc?.restockNeededQty || 0);
                    const perCarton = p.qtyPerCarton || 0;
                    const boxes = perCarton > 0 ? Math.ceil(finalQty / perCarton) : 0;
                    const isSelected = localSelectedIds.has(p.id);
                    
                    return (
                      <tr key={p.id} className={isSelected ? 'bg-blue-50/30' : ''}>
                        {/* Checkbox Cell - Hidden in Export */}
                        <td className="py-4 px-2 text-center" data-html2canvas-ignore="true">
                           <button onClick={() => toggleSelect(p.id)} className="text-slate-400 hover:text-blue-600">
                             {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                           </button>
                        </td>
                        <td className="py-4 px-2 align-middle">
                          <div className="font-bold text-slate-800 text-base">{p.sku}</div>
                          <div className="text-slate-500 text-xs mt-1">{p.name}</div>
                        </td>
                        <td className="py-4 px-2 align-middle text-center">
                           {p.image ? (
                             <img src={p.image} alt="product" className="h-14 w-14 object-cover rounded-md mx-auto border border-slate-100" crossOrigin="anonymous" />
                           ) : (
                             <div className="h-14 w-14 bg-slate-100 rounded-md mx-auto flex items-center justify-center text-slate-300">
                               <Package size={20} />
                             </div>
                           )}
                        </td>
                        <td className="py-4 px-2 align-middle text-center">
                          {isGenerating ? (
                            <div className="py-1.5 px-1 font-medium text-slate-700 text-center min-h-[32px] flex items-center justify-center">
                              {p.specs || '-'}
                            </div>
                          ) : (
                            <input 
                               type="text" 
                               className="w-full text-center bg-transparent focus:bg-white border-b border-transparent focus:border-blue-500 focus:outline-none py-1.5 px-1 font-medium text-slate-700"
                               placeholder="输入规格"
                               value={p.specs || ''}
                               onChange={(e) => onUpdateProduct(p.id, 'specs', e.target.value)}
                            />
                          )}
                        </td>
                        <td className="py-4 px-2 align-middle text-center">
                           {isGenerating ? (
                              <div className="py-1.5 px-1 font-bold text-blue-700 text-lg text-center bg-blue-50/20 rounded">
                                {finalQty}
                              </div>
                           ) : (
                              <input 
                                type="number" 
                                className="w-full text-center bg-blue-50/50 focus:bg-white border-b border-transparent focus:border-blue-500 focus:outline-none py-1.5 px-1 font-bold text-blue-700 text-lg"
                                value={finalQty}
                                onChange={(e) => onUpdateProduct(p.id, 'customRestockQty', parseInt(e.target.value) || 0)}
                              />
                           )}
                        </td>
                        <td className="py-4 px-2 align-middle text-center">
                          {isGenerating ? (
                             <div className="py-1.5 px-1 font-medium text-slate-700 text-center">
                               {p.qtyPerCarton || '-'}
                             </div>
                          ) : (
                            <input 
                               type="number" 
                               className="w-full text-center bg-transparent focus:bg-white border-b border-transparent focus:border-blue-500 focus:outline-none py-1.5 px-1 font-medium text-slate-700"
                               placeholder="0"
                               value={p.qtyPerCarton || ''}
                               onChange={(e) => onUpdateProduct(p.id, 'qtyPerCarton', parseInt(e.target.value) || 0)}
                            />
                          )}
                        </td>
                        <td className="py-4 px-2 align-middle text-center">
                           <div className="font-bold text-slate-800 text-lg flex items-center justify-center gap-1">
                             <Layers size={14} className="text-slate-400" />
                             {boxes}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                    {/* Add extra td for offset because of checkbox column, also hide it in export */}
                    <td data-html2canvas-ignore="true"></td> 
                    
                    <td colSpan={3} className="py-4 px-2 text-right font-bold text-slate-600">合计:</td>
                    <td className="py-4 px-2 text-center font-bold text-blue-700 text-xl">{summary.totalQty}</td>
                    <td className="py-4 px-2"></td>
                    <td className="py-4 px-2 text-center font-bold text-slate-900 text-xl">{summary.totalCartons}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer Notes - Simplified */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <p>生成于 StockFlow 库存管理系统</p>
                <div className="flex gap-4">
                  <p>日期: <span className="font-medium text-slate-600">{currentDate}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            取消修改
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            导出图片
          </button>
        </div>
      </div>
    </div>
  );
};