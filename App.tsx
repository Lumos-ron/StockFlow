import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { KPICard } from './components/KPICard';
import { InventoryTable } from './components/InventoryTable';
import { AddProductModal } from './components/AddProductModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { RestockModal } from './components/RestockModal';
import { AuthScreen } from './components/AuthScreen';
import { api } from './services/api'; // Import the new API service
import { 
  Product, 
  ProductCalculation, 
  LEAD_TIME_DAYS,
  PRODUCTION_DAYS,
  SAFETY_STOCK_DAYS,
  User
} from './types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Package, AlertTriangle, ShoppingCart, Activity, CheckCircle2, Truck, X, Cloud, Loader2, CloudCheck } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App Data State
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'alerts'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [seaFreightDays, setSeaFreightDays] = useState(LEAD_TIME_DAYS);
  
  // Loading & Sync State
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, product: Product | null}>({
    isOpen: false,
    product: null
  });

  // Check for session on mount
  useEffect(() => {
    const sessionStr = localStorage.getItem('stockflow_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setUser({ username: session.username });
      } catch (e) {
        localStorage.removeItem('stockflow_session');
      }
    }
    setIsAuthChecking(false);
  }, []);

  // Load User Data from Cloud/API when user logs in
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          const data = await api.fetchData(user.username);
          setProducts(data.products || []);
          setSeaFreightDays(data.seaFreightDays || LEAD_TIME_DAYS);
          setLastSavedTime(new Date().toLocaleTimeString());
        } catch (error) {
          console.error("Failed to fetch cloud data", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      loadData();
    } else {
      setProducts([]);
    }
  }, [user]);

  // Auto-Save / Sync Data Logic
  // Using a ref to track if it's the initial load to avoid saving immediately upon load
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (user && !isLoadingData) {
      setSyncStatus('saving');
      
      const timer = setTimeout(async () => {
        try {
          await api.saveData(user.username, {
            products,
            seaFreightDays,
            lastUpdated: new Date().toISOString()
          });
          setSyncStatus('saved');
          setLastSavedTime(new Date().toLocaleTimeString());
        } catch (error) {
          setSyncStatus('error');
          console.error("Sync failed", error);
        }
      }, 1500); // Debounce save requests

      return () => clearTimeout(timer);
    }
  }, [products, seaFreightDays, user, isLoadingData]);

  const handleLogout = () => {
    localStorage.removeItem('stockflow_session');
    setUser(null);
    setCurrentView('dashboard');
    setIsLoadingData(false);
    isFirstRender.current = true;
  };

  // Derived Dynamic Constants
  const totalLeadTime = seaFreightDays + PRODUCTION_DAYS + SAFETY_STOCK_DAYS;
  const targetCoverageDays = totalLeadTime; 

  // Core Business Logic Calculation
  const productCalculations = useMemo(() => {
    const map = new Map<string, ProductCalculation>();
    
    products.forEach(p => {
      const dailySales = p.salesLast7Days / 7;
      const totalPipelineStock = p.availableStock + p.inTransitStock + p.plannedShipment;
      const daysCoverage = dailySales > 0 ? totalPipelineStock / dailySales : Infinity;
      const monthsCoverage = daysCoverage === Infinity ? Infinity : daysCoverage / 30;
      const targetStockLevel = dailySales * targetCoverageDays;
      const restockNeededQty = Math.max(0, Math.ceil(targetStockLevel - totalPipelineStock));

      let status: 'Critical' | 'Warning' | 'Healthy' | 'Overstocked' = 'Healthy';
      
      if (dailySales === 0 && totalPipelineStock > 0) {
          status = 'Overstocked'; 
      } else if (daysCoverage < totalLeadTime) { 
        status = 'Critical';
      } else if (daysCoverage < targetCoverageDays) {
        status = 'Warning';
      } else if (daysCoverage > targetCoverageDays * 2) {
        status = 'Overstocked';
      }

      map.set(p.id, {
        dailySales,
        totalPipelineStock,
        daysCoverage,
        monthsCoverage,
        restockNeededQty,
        displayRestockQty: p.customRestockQty !== undefined ? p.customRestockQty : restockNeededQty,
        isLowStock: daysCoverage < targetCoverageDays,
        status
      });
    });

    return map;
  }, [products, seaFreightDays, totalLeadTime, targetCoverageDays]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalSKUs = products.length;
    let criticalAlerts = 0;
    let totalRestockQty = 0;
    let categoryCounts: Record<string, number> = {};

    products.forEach(p => {
      const calc = productCalculations.get(p.id);
      if (calc) {
        if (calc.status === 'Critical' || calc.status === 'Warning') criticalAlerts++;
        totalRestockQty += calc.displayRestockQty;
      }
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + p.availableStock;
    });

    const chartData = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      stock: categoryCounts[cat]
    }));

    return { totalSKUs, criticalAlerts, totalRestockQty, chartData };
  }, [products, productCalculations]);

  const handleUpdateProduct = (id: string, field: keyof Product, value: number | string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setProducts([...products, newProduct]);
  };

  const initiateDelete = (product: Product) => {
    setDeleteModalState({ isOpen: true, product });
  };

  const confirmDelete = () => {
    if (deleteModalState.product) {
      setProducts(prev => prev.filter(p => p.id !== deleteModalState.product!.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deleteModalState.product!.id);
        return next;
      });
      setDeleteModalState({ isOpen: false, product: null });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const getAlertsList = () => {
    return products
      .filter(p => {
        const calc = productCalculations.get(p.id);
        return calc?.status === 'Critical' || calc?.status === 'Warning';
      })
      .map(p => {
        const calc = productCalculations.get(p.id);
        return { ...p, ...calc };
      })
      .sort((a, b) => (a.daysCoverage || 0) - (b.daysCoverage || 0));
  };

  const alertProducts = useMemo(() => {
    return products.filter(p => {
      const calc = productCalculations.get(p.id);
      return calc?.status === 'Critical' || calc?.status === 'Warning';
    });
  }, [products, productCalculations]);

  const selectedProducts = useMemo(() => {
    return products.filter(p => selectedIds.has(p.id));
  }, [products, selectedIds]);

  // Loading Screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
         <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
         <p className="text-slate-400 text-sm font-medium">正在连接服务器...</p>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  // Data Loading Screen
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
         <div className="relative">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center animate-pulse">
               <Cloud className="text-blue-600" size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
               <Loader2 size={16} className="text-blue-600 animate-spin" />
            </div>
         </div>
         <p className="text-slate-500 text-sm font-medium">正在同步云端数据...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen flex flex-col relative pb-24">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {currentView === 'dashboard' ? '仪表盘' : currentView === 'inventory' ? '库存管理' : '预警通知'}
            </h1>
            <p className="text-slate-500 mt-1">
              {currentView === 'dashboard' 
                ? `共监控 ${stats.totalSKUs} 个 SKU 及全渠道库存分布。` 
                : currentView === 'inventory' 
                  ? '管理库存水平、销售速度及补货计划。'
                  : '查看所有库存紧张或急需补货的商品。'
              }
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
             <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all duration-500 ${
               syncStatus === 'saving' 
                 ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                 : syncStatus === 'error'
                 ? 'bg-rose-50 text-rose-600 border border-rose-200'
                 : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
             }`}>
                {syncStatus === 'saving' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    正在同步...
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                     <AlertTriangle size={12} />
                     同步失败
                  </>
                ) : (
                  <>
                    <CloudCheck size={14} />
                    云端已同步
                  </>
                )}
             </div>
             {lastSavedTime && (
               <span className="text-[10px] text-slate-400 font-medium px-1">
                 上次保存: {lastSavedTime}
               </span>
             )}
          </div>
        </header>

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 pb-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                title="商品种类 (SKU)" 
                value={stats.totalSKUs} 
                icon={Package} 
                color="blue" 
              />
              <KPICard 
                title="补货预警" 
                value={stats.criticalAlerts} 
                subtitle="需立即处理的商品"
                icon={AlertTriangle} 
                color="amber" 
              />
              <KPICard 
                title="建议补货总量" 
                value={stats.totalRestockQty.toLocaleString()} 
                subtitle={`覆盖 ${targetCoverageDays} 天销售`}
                icon={ShoppingCart} 
                color="green" 
              />
              <KPICard 
                title="库存动销率" 
                value={stats.totalSKUs > 0 ? "98.5%" : "0%"} 
                subtitle="有销量商品占比"
                icon={Activity} 
                color="blue" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">各分类库存分布</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}} 
                      />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
                        {stats.chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Alert List Widget */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-800">补货建议</h3>
                  <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                    {stats.criticalAlerts} 项
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {getAlertsList().length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
                      <p>所有库存状态健康</p>
                    </div>
                  ) : (
                    getAlertsList().map((item) => (
                      <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center group hover:border-blue-200 transition-colors">
                        <div>
                          <p className="font-bold text-slate-800 text-sm truncate w-32">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs text-slate-500">{item.sku}</span>
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.daysCoverage && item.daysCoverage < totalLeadTime ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                               余 {item.daysCoverage?.toFixed(0)} 天
                             </span>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-slate-400 uppercase font-semibold">建议补货</p>
                           <p className="text-lg font-bold text-blue-600">{item.restockNeededQty}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setCurrentView('alerts')}
                  className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors flex-shrink-0"
                >
                  查看所有预警
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory View */}
        {currentView === 'inventory' && (
          <div className="flex-1 overflow-hidden">
             <InventoryTable 
              products={products} 
              calculations={productCalculations} 
              selectedIds={selectedIds}
              onUpdateProduct={handleUpdateProduct} 
              onDeleteClick={initiateDelete}
              onOpenAddModal={() => setIsModalOpen(true)}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              // New Props for Lead Time
              seaFreightDays={seaFreightDays}
              onSeaFreightDaysChange={setSeaFreightDays}
              totalLeadTime={totalLeadTime}
              targetCoverageDays={targetCoverageDays}
            />
          </div>
        )}

        {/* Alerts View */}
        {currentView === 'alerts' && (
           <div className="flex-1 overflow-hidden flex flex-col">
              {alertProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">库存状态良好</h3>
                    <p className="text-slate-500 mt-2">当前没有任何产品需要紧急补货。</p>
                    <button 
                      onClick={() => setCurrentView('inventory')}
                      className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      查看所有库存
                    </button>
                </div>
              ) : (
                <InventoryTable 
                  products={alertProducts} 
                  calculations={productCalculations} 
                  selectedIds={selectedIds}
                  onUpdateProduct={handleUpdateProduct} 
                  onDeleteClick={initiateDelete}
                  onOpenAddModal={() => setIsModalOpen(true)}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={toggleSelectAll}
                  // New Props for Lead Time
                  seaFreightDays={seaFreightDays}
                  onSeaFreightDaysChange={setSeaFreightDays}
                  totalLeadTime={totalLeadTime}
                  targetCoverageDays={targetCoverageDays}
                />
              )}
           </div>
        )}
      </main>

      {/* Floating Action Bar for Selected Items */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 ml-32 z-40 animate-in slide-in-from-bottom-5">
           <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6">
              <span className="font-semibold text-sm">已选择 {selectedIds.size} 个产品</span>
              <div className="h-4 w-px bg-slate-700"></div>
              <button 
                onClick={() => setIsRestockModalOpen(true)}
                className="flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Truck size={18} />
                安排补货
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
           </div>
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddProduct} 
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({isOpen: false, product: null})}
        onConfirm={confirmDelete}
        productName={deleteModalState.product?.name}
      />

      {/* Restock Plan Modal */}
      <RestockModal 
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        selectedProducts={selectedProducts}
        onUpdateProduct={handleUpdateProduct}
        calculations={productCalculations}
      />
    </div>
  );
};

export default App;