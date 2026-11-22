import React, { useState, useEffect, useCallback } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar, NavTab } from './components/layout/AppSidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DailySalesEntryScreen } from './components/dailySales/DailySalesEntryScreen';
import { DailyClosingReportModal } from './components/dailySales/DailyClosingReportModal';
import { DailySalesHistoryModal } from './components/dailySales/DailySalesHistoryModal';
import { StockOverviewMatrix } from './components/inventory/StockOverviewMatrix';
import { ProductList } from './components/inventory/ProductList';
import { StockMovementsLedger } from './components/inventory/StockMovementsLedger';
import { StockAlertsBanner } from './components/inventory/StockAlertsBanner';
import { CreateProductModal } from './components/inventory/CreateProductModal';
import { OpeningStockModal } from './components/inventory/OpeningStockModal';
import { StockAdjustmentModal } from './components/inventory/StockAdjustmentModal';
import { WastageModal } from './components/inventory/WastageModal';
import { PurchaseList } from './components/purchase/PurchaseList';
import { PurchaseEntryScreen } from './components/purchase/PurchaseEntryScreen';
import { PurchaseInvoiceModal } from './components/purchase/PurchaseInvoiceModal';
import { PurchaseReturnModal } from './components/purchase/PurchaseReturnModal';
import { SupplierLedgerModal } from './components/purchase/SupplierLedgerModal';
import { PurchaseRateHistoryModal } from './components/purchase/PurchaseRateHistoryModal';
import { CreateSupplierModal } from './components/purchase/CreateSupplierModal';
import { PartyManagementScreen } from './components/parties/PartyManagementScreen';
import { CustomerModal } from './components/parties/CustomerModal';
import { SupplierModal } from './components/parties/SupplierModal';
import { CustomerReceiptModal } from './components/parties/CustomerReceiptModal';
import { SupplierPaymentModal } from './components/parties/SupplierPaymentModal';
import { PartyAdjustmentModal } from './components/parties/PartyAdjustmentModal';
import { PartyStatementModal } from './components/parties/PartyStatementModal';
import { PartyProfileDrawer } from './components/parties/PartyProfileDrawer';
import { FinancialDashboardScreen } from './components/accounting/FinancialDashboardScreen';
import { MillingProductionScreen } from './components/production/MillingProductionScreen';
import { CommissionManagementScreen } from './components/commission/CommissionManagementScreen';
import { ExportManagementScreen } from './components/export/ExportManagementScreen';
import { WarehouseTransfersScreen } from './components/transfers/WarehouseTransfersScreen';
import { FeatureSettingsModal } from './components/settings/FeatureSettingsModal';
import { MainDashboardScreen } from './components/dashboard/MainDashboardScreen';
import { BusinessReportsScreen } from './components/reports/BusinessReportsScreen';
import { UserManagementScreen } from './components/admin/UserManagementScreen';
import { AuditLogsScreen } from './components/admin/AuditLogsScreen';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { inventoryService } from './services/inventory.service';
import { dailySalesService } from './services/dailySales.service';
import { purchaseService } from './services/purchase.service';
import { partyService } from './services/party.service';
import { advancedService } from './services/advanced.service';
import type {
  RiceProduct,
  RiceCategory,
  Warehouse,
  StockRecord,
  StockOverviewSummary,
  StockMovement,
  StockAlert,
} from './types/inventory';
import type { DailyClosingReportResponse } from './types/dailySales';
import type { Purchase } from './types/purchase';
import type { Customer, Supplier } from './types/party';
import type { CompanySettings } from './types/advanced';
import { CheckCircle2, X } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Master Data State
  const [products, setProducts] = useState<RiceProduct[]>([]);
  const [categories, setCategories] = useState<RiceCategory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [summary, setSummary] = useState<StockOverviewSummary>({
    totalBags: 0,
    totalWeightKg: '0',
    totalMaunds: '0',
    totalMetricTons: '0',
    totalValuation: '0',
    totalVarieties: 0,
    lowStockCount: 0,
  });
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<{ lowStock: StockAlert[]; outOfStock: StockAlert[]; totalAlerts: number }>({
    lowStock: [],
    outOfStock: [],
    totalAlerts: 0,
  });

  // UI Modals & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isOpeningStockOpen, setIsOpeningStockOpen] = useState(false);
  const [selectedStockForAdjustment, setSelectedStockForAdjustment] = useState<StockRecord | null>(null);
  const [selectedStockForWastage, setSelectedStockForWastage] = useState<StockRecord | null>(null);
  const [ledgerProductIdFilter, setLedgerProductIdFilter] = useState<string | undefined>(undefined);

  // Daily Sales Modals State
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<DailyClosingReportResponse | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Purchase Modals & Views State
  const [isPurchaseEntryOpen, setIsPurchaseEntryOpen] = useState(false);
  const [selectedPurchaseForInvoice, setSelectedPurchaseForInvoice] = useState<Purchase | null>(null);
  const [selectedPurchaseForReturn, setSelectedPurchaseForReturn] = useState<Purchase | null>(null);
  const [selectedSupplierIdForLedger, setSelectedSupplierIdForLedger] = useState<string | undefined>(undefined);
  const [isSupplierLedgerOpen, setIsSupplierLedgerOpen] = useState(false);
  const [isRateHistoryOpen, setIsRateHistoryOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);

  // Parties & Khatabook Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);

  const [isCustomerReceiptOpen, setIsCustomerReceiptOpen] = useState(false);
  const [selectedCustomerForReceipt, setSelectedCustomerForReceipt] = useState<Customer | null>(null);

  const [isSupplierPaymentOpen, setIsSupplierPaymentOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);

  const [isPartyAdjustmentOpen, setIsPartyAdjustmentOpen] = useState(false);
  const [adjustmentPartyType, setAdjustmentPartyType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [selectedPartyForAdjustment, setSelectedPartyForAdjustment] = useState<Customer | Supplier | null>(null);

  const [isPartyStatementOpen, setIsPartyStatementOpen] = useState(false);
  const [statementPartyType, setStatementPartyType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [selectedPartyForStatement, setSelectedPartyForStatement] = useState<Customer | Supplier | null>(null);

  const [isPartyProfileOpen, setIsPartyProfileOpen] = useState(false);
  const [profilePartyType, setProfilePartyType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [selectedPartyForProfile, setSelectedPartyForProfile] = useState<Customer | Supplier | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Master Registries (Categories, Warehouses, Suppliers, Settings)
  const fetchRegistries = useCallback(async () => {
    try {
      const [cats, whs, sups, compSettings] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getWarehouses(),
        partyService.getSuppliers(),
        advancedService.getCompanySettings().catch(() => null),
      ]);
      setCategories(cats);
      setWarehouses(whs);
      setSuppliers(sups);
      if (compSettings) setCompanySettings(compSettings);
      if (whs.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(whs[0].id);
      }
    } catch (err) {
      console.error('Failed to load categories/warehouses/suppliers:', err);
    }
  }, [selectedWarehouseId]);

  // 2. Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      const prods = await inventoryService.getProducts();
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  // 3. Fetch Stock Matrix & Valuation Summary
  const fetchStockOverview = useCallback(async (whId?: string) => {
    try {
      setIsLoading(true);
      const data = await inventoryService.getStockOverview({ warehouseId: whId || undefined });
      setStocks(data.stocks);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 4. Fetch Stock Movements
  const fetchMovements = useCallback(async (filters?: any) => {
    try {
      const data = await inventoryService.getStockMovements(filters);
      setMovements(data.movements);
    } catch (err) {
      console.error('Failed to load movements:', err);
    }
  }, []);

  // 5. Fetch Stock Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const alertData = await inventoryService.getStockAlerts();
      setAlerts(alertData);
    } catch (err) {
      console.error('Failed to load stock alerts:', err);
    }
  }, []);

  // Initial Load (Only when user is authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistries();
      fetchProducts();
      fetchStockOverview(selectedWarehouseId);
      fetchMovements();
      fetchAlerts();
    }
  }, [isAuthenticated, fetchRegistries, fetchProducts, fetchStockOverview, fetchMovements, fetchAlerts, selectedWarehouseId]);

  const handleWarehouseFilterChange = (whId: string) => {
    setSelectedWarehouseId(whId);
    fetchStockOverview(whId);
  };

  const handleRefreshAll = () => {
    if (isAuthenticated) {
      fetchRegistries();
      fetchProducts();
      fetchStockOverview(selectedWarehouseId);
      fetchMovements();
      fetchAlerts();
    }
  };

  const handleViewLedgerForProduct = (prodId: string) => {
    setLedgerProductIdFilter(prodId);
    fetchMovements({ productId: prodId });
    setActiveTab('movements');
  };

  // Open Report Modal
  const handleOpenReportModal = async (entryId: string) => {
    try {
      setSelectedReportId(entryId);
      const data = await dailySalesService.getDailyClosingReport(entryId);
      setReportData(data);
    } catch (err) {
      showToast('Failed to load report voucher');
    }
  };

  // If verifying authentication session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-3xl bg-emerald-700 flex items-center justify-center text-2xl font-black mb-4 animate-pulse shadow-xl shadow-emerald-900/50">
          AR
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">العرب رائز ٹریڈرز</h2>
        <p className="text-xs text-emerald-400 mt-1 font-medium">سیکیورٹی تصدیق جاری ہے...</p>
      </div>
    );
  }

  // If not authenticated, require password login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700/80 animate-in slide-in-from-bottom-5 max-w-[92vw]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-2 cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <AppHeader
        selectedWarehouse={selectedWarehouseId}
        onSelectWarehouse={handleWarehouseFilterChange}
        warehouses={warehouses}
        alertCount={alerts.totalAlerts}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onToast={showToast}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <AppSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
            if (tab === 'opening-stock') setIsOpeningStockOpen(true);
            if (tab === 'purchases') setIsPurchaseEntryOpen(false);
          }}
          lowStockCount={alerts.totalAlerts}
          companySettings={companySettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isOpenOnMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 overflow-x-hidden">
          {/* TAB 0: Main Business Intelligence Dashboard */}
          {activeTab === 'dashboard' && (
            <MainDashboardScreen />
          )}

          {/* TAB: Comprehensive Business Intelligence Reports */}
          {activeTab === 'reports' && (
            <BusinessReportsScreen />
          )}

          {/* TAB 1: Daily Sales Entry (CORE WORKFLOW) */}
          {activeTab === 'daily-sales' && (
            <DailySalesEntryScreen
              warehouses={warehouses}
              activeWarehouseId={selectedWarehouseId}
              onOpenReport={handleOpenReportModal}
              onOpenHistory={() => setIsHistoryOpen(true)}
              showToast={showToast}
            />
          )}

          {/* TAB 2: Purchases & Procurement (MANDI WORKFLOW) */}
          {activeTab === 'purchases' && (
            <>
              {isPurchaseEntryOpen ? (
                <PurchaseEntryScreen
                  warehouses={warehouses}
                  activeWarehouseId={selectedWarehouseId}
                  onSuccess={(purchase) => {
                    setIsPurchaseEntryOpen(false);
                    setSelectedPurchaseForInvoice(purchase);
                    handleRefreshAll();
                  }}
                  onCancel={() => setIsPurchaseEntryOpen(false)}
                  onOpenCreateSupplier={() => setIsCreateSupplierOpen(true)}
                  onOpenLedger={(supId) => {
                    setSelectedSupplierIdForLedger(supId);
                    setIsSupplierLedgerOpen(true);
                  }}
                  onOpenRateHistory={() => setIsRateHistoryOpen(true)}
                  showToast={showToast}
                />
              ) : (
                <PurchaseList
                  warehouses={warehouses}
                  suppliers={suppliers as any}
                  products={products}
                  onNewPurchase={() => setIsPurchaseEntryOpen(true)}
                  onViewInvoice={(p) => setSelectedPurchaseForInvoice(p)}
                  onOpenReturn={(p) => setSelectedPurchaseForReturn(p)}
                  onViewLedger={(supId) => {
                    setSelectedSupplierIdForLedger(supId);
                    setIsSupplierLedgerOpen(true);
                  }}
                  onViewRateHistory={() => setIsRateHistoryOpen(true)}
                />
              )}
            </>
          )}

          {/* TAB 3: Parties & Khatabook System (CUSTOMERS & SUPPLIERS) */}
          {activeTab === 'parties' && (
            <PartyManagementScreen
              onOpenCustomerModal={(cust) => {
                setSelectedCustomerForEdit(cust || null);
                setIsCustomerModalOpen(true);
              }}
              onOpenSupplierModal={(supp) => {
                setSelectedSupplierForEdit(supp || null);
                setIsSupplierModalOpen(true);
              }}
              onOpenCustomerReceipt={(cust) => {
                setSelectedCustomerForReceipt(cust);
                setIsCustomerReceiptOpen(true);
              }}
              onOpenSupplierPayment={(supp) => {
                setSelectedSupplierForPayment(supp);
                setIsSupplierPaymentOpen(true);
              }}
              onOpenAdjustment={(type, party) => {
                setAdjustmentPartyType(type);
                setSelectedPartyForAdjustment(party);
                setIsPartyAdjustmentOpen(true);
              }}
              onOpenStatement={(type, party) => {
                setStatementPartyType(type);
                setSelectedPartyForStatement(party);
                setIsPartyStatementOpen(true);
              }}
              onOpenProfile={(type, party) => {
                setProfilePartyType(type);
                setSelectedPartyForProfile(party);
                setIsPartyProfileOpen(true);
              }}
              showToast={showToast}
            />
          )}

          {/* TAB: Financial Accounting & Treasury */}
          {activeTab === 'accounting' && (
            <FinancialDashboardScreen />
          )}

          {/* TAB: Rice Milling & Production Yield */}
          {activeTab === 'production' && (
            <MillingProductionScreen warehouses={warehouses} products={products} />
          )}

          {/* TAB: Commission & Broker Management */}
          {activeTab === 'commission' && (
            <CommissionManagementScreen />
          )}

          {/* TAB: International Rice Export */}
          {activeTab === 'export' && (
            <ExportManagementScreen />
          )}

          {/* TAB: Warehouse Logistics & Transfers */}
          {activeTab === 'transfers' && (
            <WarehouseTransfersScreen />
          )}

          {/* TAB 4: Stock Overview Matrix */}
          {activeTab === 'stock-overview' && (
            <StockOverviewMatrix
              stocks={stocks}
              summary={summary}
              warehouses={warehouses}
              selectedWarehouseId={selectedWarehouseId}
              onSelectWarehouse={handleWarehouseFilterChange}
              isLoading={isLoading}
              onOpenOpeningStock={() => setIsOpeningStockOpen(true)}
              onOpenAdjustment={(stock) => setSelectedStockForAdjustment(stock)}
              onOpenWastage={(stock) => setSelectedStockForWastage(stock)}
              onViewLedger={handleViewLedgerForProduct}
            />
          )}

          {/* TAB 5: Products Catalog */}
          {activeTab === 'products' && (
            <ProductList
              products={products}
              categories={categories}
              isLoading={isLoading}
              onOpenCreateModal={() => setIsCreateProductOpen(true)}
              onSelectProductMovements={handleViewLedgerForProduct}
            />
          )}

          {/* TAB 6: Stock Movements Audit Ledger */}
          {activeTab === 'movements' && (
            <StockMovementsLedger
              movements={movements}
              warehouses={warehouses}
              products={products}
              selectedProductId={ledgerProductIdFilter}
              isLoading={isLoading}
              onFilterChange={(filters) => fetchMovements(filters)}
            />
          )}

          {/* TAB 7: Stock Alert Engine */}
          {activeTab === 'alerts' && (
            <StockAlertsBanner
              lowStock={alerts.lowStock}
              outOfStock={alerts.outOfStock}
              isLoading={isLoading}
              onOpenProcurementOrder={(productName) => {
                setIsPurchaseEntryOpen(true);
                setActiveTab('purchases');
                showToast(`Started inward bill draft for ${productName}`);
              }}
            />
          )}

          {/* TAB 8: Operator & User Management (Admin only) */}
          {activeTab === 'users' && (
            <UserManagementScreen onToast={showToast} />
          )}

          {/* TAB 9: Immutable Audit Trail & Compliance (Admin only) */}
          {activeTab === 'audit' && (
            <AuditLogsScreen onToast={showToast} />
          )}
        </main>
      </div>

      {/* Modal: Daily Closing Printable Report */}
      <DailyClosingReportModal
        isOpen={!!selectedReportId}
        onClose={() => {
          setSelectedReportId(null);
          setReportData(null);
        }}
        reportData={reportData}
      />

      {/* Modal: Past Daily Closings History */}
      <DailySalesHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        warehouseId={selectedWarehouseId}
        onSelectEntryForReport={handleOpenReportModal}
        onEntryReversed={() => {
          showToast('Daily sales closing reversed and stock restored');
          handleRefreshAll();
        }}
      />

      {/* Modal: Register Rice Product */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        categories={categories}
        warehouses={warehouses}
        onSuccess={() => {
          showToast('New rice variety registered successfully in database');
          handleRefreshAll();
        }}
      />

      {/* Modal: Opening Stock Entry */}
      <OpeningStockModal
        isOpen={isOpeningStockOpen}
        onClose={() => setIsOpeningStockOpen(false)}
        products={products}
        warehouses={warehouses}
        onSuccess={() => {
          showToast('Opening physical stock balance and valuation recorded');
          handleRefreshAll();
        }}
      />

      {/* Modal: Physical Audit Adjustment */}
      <StockAdjustmentModal
        isOpen={!!selectedStockForAdjustment}
        onClose={() => setSelectedStockForAdjustment(null)}
        stock={selectedStockForAdjustment}
        onSuccess={() => {
          showToast('Physical audit cycle count adjustment posted to ledger');
          handleRefreshAll();
        }}
      />

      {/* Modal: Wastage / Damage Write-Off */}
      <WastageModal
        isOpen={!!selectedStockForWastage}
        onClose={() => setSelectedStockForWastage(null)}
        stock={selectedStockForWastage}
        onSuccess={() => {
          showToast('Inventory wastage loss recorded and written off');
          handleRefreshAll();
        }}
      />

      {/* Modal: Purchase Inward Invoice / Kanda Weighbridge Slip */}
      <PurchaseInvoiceModal
        isOpen={!!selectedPurchaseForInvoice}
        onClose={() => setSelectedPurchaseForInvoice(null)}
        purchase={selectedPurchaseForInvoice}
      />

      {/* Modal: Debit Note / Purchase Rejection Return */}
      <PurchaseReturnModal
        isOpen={!!selectedPurchaseForReturn}
        onClose={() => setSelectedPurchaseForReturn(null)}
        purchase={selectedPurchaseForReturn}
        onSuccess={() => {
          showToast('Quality return posted! Godown stock & Khatabook debited.');
          handleRefreshAll();
        }}
      />

      {/* Modal: Supplier Khatabook & Statement */}
      <SupplierLedgerModal
        isOpen={isSupplierLedgerOpen}
        onClose={() => setIsSupplierLedgerOpen(false)}
        suppliers={suppliers as any}
        defaultSupplierId={selectedSupplierIdForLedger}
      />

      {/* Modal: Purchase Rate Intelligence & History */}
      <PurchaseRateHistoryModal
        isOpen={isRateHistoryOpen}
        onClose={() => setIsRateHistoryOpen(false)}
        products={products}
      />

      {/* Modal: Quick Register Supplier / Arthi */}
      <CreateSupplierModal
        isOpen={isCreateSupplierOpen}
        onClose={() => setIsCreateSupplierOpen(false)}
        onSuccess={(newSupplier) => {
          showToast(`Supplier ${newSupplier.name} registered successfully`);
          fetchRegistries();
        }}
      />

      {/* ==================== STEP 7 PARTY MODALS ==================== */}

      {/* Customer Create / Edit Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomerForEdit(null);
        }}
        customer={selectedCustomerForEdit}
        onSuccess={(c) => {
          showToast(`Customer ${c.name} saved successfully with live Khata ledger`);
          fetchRegistries();
        }}
      />

      {/* Supplier Create / Edit Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSelectedSupplierForEdit(null);
        }}
        supplier={selectedSupplierForEdit}
        onSuccess={(s) => {
          showToast(`Supplier ${s.name} saved successfully with live Khata ledger`);
          fetchRegistries();
        }}
      />

      {/* Customer Receipt (Vasooli) Modal */}
      <CustomerReceiptModal
        isOpen={isCustomerReceiptOpen}
        onClose={() => {
          setIsCustomerReceiptOpen(false);
          setSelectedCustomerForReceipt(null);
        }}
        customer={selectedCustomerForReceipt}
        onSuccess={(newBal) => {
          showToast(`Customer receipt posted! New receivable balance: PKR ${Number(newBal).toLocaleString()}`);
          fetchRegistries();
        }}
      />

      {/* Supplier Payment (Adaigi) Modal */}
      <SupplierPaymentModal
        isOpen={isSupplierPaymentOpen}
        onClose={() => {
          setIsSupplierPaymentOpen(false);
          setSelectedSupplierForPayment(null);
        }}
        supplier={selectedSupplierForPayment}
        onSuccess={(newBal) => {
          showToast(`Supplier payment posted! New payable balance: PKR ${Number(newBal).toLocaleString()}`);
          fetchRegistries();
        }}
      />

      {/* Party Khatabook Adjustment Note Modal */}
      <PartyAdjustmentModal
        isOpen={isPartyAdjustmentOpen}
        onClose={() => {
          setIsPartyAdjustmentOpen(false);
          setSelectedPartyForAdjustment(null);
        }}
        partyType={adjustmentPartyType}
        party={selectedPartyForAdjustment}
        onSuccess={(newBal) => {
          showToast(`Khatabook adjustment posted! New balance: PKR ${Number(newBal).toLocaleString()}`);
          fetchRegistries();
        }}
      />

      {/* Full Party Statement & WhatsApp Sharing Modal */}
      <PartyStatementModal
        isOpen={isPartyStatementOpen}
        onClose={() => {
          setIsPartyStatementOpen(false);
          setSelectedPartyForStatement(null);
        }}
        partyType={statementPartyType}
        party={selectedPartyForStatement}
      />

      {/* Party Profile Drawer */}
      <PartyProfileDrawer
        isOpen={isPartyProfileOpen}
        onClose={() => {
          setIsPartyProfileOpen(false);
          setSelectedPartyForProfile(null);
        }}
        partyType={profilePartyType}
        party={selectedPartyForProfile}
        onOpenStatement={() => {
          setIsPartyProfileOpen(false);
          setStatementPartyType(profilePartyType);
          setSelectedPartyForStatement(selectedPartyForProfile);
          setIsPartyStatementOpen(true);
        }}
        onOpenTransaction={() => {
          setIsPartyProfileOpen(false);
          if (profilePartyType === 'CUSTOMER') {
            setSelectedCustomerForReceipt(selectedPartyForProfile as Customer);
            setIsCustomerReceiptOpen(true);
          } else {
            setSelectedSupplierForPayment(selectedPartyForProfile as Supplier);
            setIsSupplierPaymentOpen(true);
          }
        }}
        onOpenAdjustment={() => {
          setIsPartyProfileOpen(false);
          setAdjustmentPartyType(profilePartyType);
          setSelectedPartyForAdjustment(selectedPartyForProfile);
          setIsPartyAdjustmentOpen(true);
        }}
        onEdit={() => {
          setIsPartyProfileOpen(false);
          if (profilePartyType === 'CUSTOMER') {
            setSelectedCustomerForEdit(selectedPartyForProfile as Customer);
            setIsCustomerModalOpen(true);
          } else {
            setSelectedSupplierForEdit(selectedPartyForProfile as Supplier);
            setIsSupplierModalOpen(true);
          }
        }}
      />

      {/* Enterprise Module Feature Settings Modal */}
      <FeatureSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={(updated) => {
          setCompanySettings(updated);
          showToast('Enterprise feature modules updated');
        }}
      />

      {/* Operator Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccessToast={showToast}
      />

      {/* Mobile Bottom Navigation Bar (Fixed 1-Tap Thumb Navigation) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
          if (tab === 'opening-stock') setIsOpeningStockOpen(true);
          if (tab === 'purchases') setIsPurchaseEntryOpen(false);
        }}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
