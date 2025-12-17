import React from 'react';
import { Product, ProductCalculation } from '../types';
import { AlertTriangle, CheckCircle2, TrendingDown, Info, Plus, ImageOff, Trash2, Store, Clock } from 'lucide-react';

interface InventoryTableProps {
  products: Product[];
  calculations: Map<string, ProductCalculation>;
  selectedIds: Set<string>;
  onUpdateProduct: (id: string, field: keyof Product, value: number | string) => void;
  onOpenAddModal: () => void;
  onDeleteClick: (product: Product) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  // New props for dynamic lead time
  seaFreightDays: number;
  onSeaFreightDaysChange: (days: number) => void;
  totalLeadTime: number;
  targetCoverageDays: number;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  products, 
  calculations, 
  selectedIds,
  onUpdateProduct, 
  onOpenAddModal, 
  onDeleteClick,
  onToggleSelect,
  onToggleSelectAll,
  seaFreightDays,
  onSeaFreightDaysChange,
  totalLeadTime,
  targetCoverageDays
}) => {
  
  const getStatusBadge = (calc: ProductCalculation) => {
    switch (calc.status) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
            <TrendingDown size={14} /> 严重缺货
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            <AlertTriangle size={14} /> 库存紧张
          </span>
        );
      case 'Overstocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            <Info size={14} /> 库存积压
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={14} /> 库存健康
          </span>
        );
    }
  };

  const isAllSelected = products.length > 0 && selectedIds.size === products.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-white to-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800">库存详情与规划</h2>
          <p className="text-sm text-slate-500 mt-1">
            修改数值将实时重新计算补货需求。<span className="text-blue-600 font-medium ml-1">勾选产品后可生成补货图片。</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
             <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
               <Clock size={14} className="text-slate-400" />
               海运周期(天):
             </div>
             <input 
               type="number" 
               min="1"
               className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
               value={seaFreightDays}
               onChange={(e) => onSeaFreightDaysChange(Math.max(1, parseInt(e.target.value) || 0))}
             />
          </div>

          <div className="text-xs text-slate-400 text-right hidden xl:block">
            <p title="海运+生产+安全库存">总备货周期: <span className="font-semibold text-slate-600">{totalLeadTime}</span> 天</p>
            <p>目标覆盖天数: <span className="font-semibold text-slate-600">{targetCoverageDays}</span> 天</p>
          </div>
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          <button 
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            添加产品
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10">
              <th className="px-4 py-4 w-12 text-center bg-slate-50">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th className="px-4 py-4 font-semibold bg-slate-50 w-32">所属店铺</th>
              <th className="px-2 py-4 font-semibold bg-slate-50">产品 / SKU</th>
              <th className="px-4 py-4 font-semibold text-center w-24 bg-slate-50">可售库存</th>
              <th className="px-4 py-4 font-semibold text-center w-24 bg-slate-50">在途数量</th>
              <th className="px-4 py-4 font-semibold text-center w-24 bg-slate-50">计划发货</th>
              <th className="px-4 py-4 font-semibold text-center w-24 bg-slate-50">7日销量</th>
              <th className="px-4 py-4 font-semibold text-center w-28 bg-slate-100/50">可售天数</th>
              <th className="px-4 py-4 font-semibold text-center w-32 bg-amber-50/30">建议补货(编辑)</th>
              <th className="px-4 py-4 font-semibold text-right bg-slate-50">状态</th>
              <th className="px-4 py-4 w-12 bg-slate-50"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const calc = calculations.get(product.id);
              if (!calc) return null;
              const isSelected = selectedIds.has(product.id);

              return (
                <tr key={product.id} className={`transition-colors group ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={isSelected}
                      onChange={() => onToggleSelect(product.id)}
                    />
                  </td>
                  
                  {/* Store Column */}
                  <td className="px-4 py-4">
                     <div className="relative group/edit">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                           <Store size={14} />
                        </div>
                        <input
                          type="text"
                          className="w-full pl-7 pr-2 py-1.5 text-sm border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-600 bg-transparent hover:bg-white focus:bg-white truncate"
                          value={product.store || ''}
                          placeholder="店铺"
                          onChange={(e) => onUpdateProduct(product.id, 'store', e.target.value)}
                        />
                     </div>
                  </td>

                  <td className="px-2 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm truncate max-w-[150px]" title={product.name}>{product.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1 rounded">{product.sku}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Inputs */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-full px-2 py-1.5 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700 bg-white shadow-sm"
                      value={product.availableStock}
                      onChange={(e) => onUpdateProduct(product.id, 'availableStock', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-full px-2 py-1.5 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700 bg-white shadow-sm"
                      value={product.inTransitStock}
                      onChange={(e) => onUpdateProduct(product.id, 'inTransitStock', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-full px-2 py-1.5 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700 bg-white shadow-sm"
                      value={product.plannedShipment}
                      onChange={(e) => onUpdateProduct(product.id, 'plannedShipment', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-full px-2 py-1.5 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-700 bg-white shadow-sm"
                      value={product.salesLast7Days}
                      onChange={(e) => onUpdateProduct(product.id, 'salesLast7Days', parseInt(e.target.value) || 0)}
                    />
                  </td>

                  {/* Calculated Columns */}
                  <td className="px-4 py-4 text-center bg-slate-50/50">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-bold ${calc.daysCoverage < totalLeadTime ? 'text-rose-600' : 'text-slate-700'}`}>
                        {calc.daysCoverage === Infinity ? '∞' : calc.daysCoverage.toFixed(1)} 天
                      </span>
                    </div>
                  </td>
                  
                  {/* Editable Restock Quantity */}
                  <td className={`px-4 py-4 text-center bg-amber-50/30 ${calc.restockNeededQty > 0 ? 'bg-amber-50/60' : ''}`}>
                     <input
                      type="number"
                      min="0"
                      className={`w-full px-2 py-1.5 text-center text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold shadow-sm 
                        ${calc.displayRestockQty > 0 ? 'text-amber-700 border-amber-200 bg-white' : 'text-slate-400 border-slate-200 bg-white'}`}
                      value={product.customRestockQty !== undefined ? product.customRestockQty : calc.restockNeededQty}
                      placeholder={calc.restockNeededQty.toString()}
                      onChange={(e) => {
                         const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                         onUpdateProduct(product.id, 'customRestockQty', val);
                      }}
                    />
                    {product.customRestockQty !== undefined && product.customRestockQty !== calc.restockNeededQty && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        建议: {calc.restockNeededQty}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 text-right">
                    {getStatusBadge(calc)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(product);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="删除产品"
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};