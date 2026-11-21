import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Truck,
  Plus,
  RefreshCw,
  Search,
  Scale,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  Warehouse as WarehouseIcon,
  Filter,
} from 'lucide-react';
import { advancedService } from '../../services/advanced.service';
import { inventoryService } from '../../services/inventory.service';
import { WarehouseTransfer } from '../../types/advanced';
import { Warehouse, RiceProduct } from '../../types/inventory';
import { CreateWarehouseTransferModal } from './CreateWarehouseTransferModal';
import { ReceiveTransferModal } from './ReceiveTransferModal';
import { StockReconciliationModal } from './StockReconciliationModal';

export const WarehouseTransfersScreen: React.FC = () => {
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<RiceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [selectedTransferForReceive, setSelectedTransferForReceive] = useState<WarehouseTransfer | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [trfList, whList, prodList] = await Promise.all([
        advancedService.getWarehouseTransfers(),
        inventoryService.getWarehouses(),
        inventoryService.getProducts(),
      ]);
      setTransfers(trfList || []);
      setWarehouses(whList || []);
      setProducts(prodList || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load warehouse transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (data: any) => {
    await advancedService.createWarehouseTransfer(data);
    await loadData();
  };

  const handleReceiveTransfer = async (transferId: string, data: any) => {
    await advancedService.receiveWarehouseTransfer(transferId, data);
    await loadData();
  };

  const handleReconcileStock = async (data: any) => {
    await advancedService.reconcileWarehouseStock(data);
    await loadData();
  };

  const openReceiveModal = (transfer: WarehouseTransfer) => {
    setSelectedTransferForReceive(transfer);
    setIsReceiveModalOpen(true);
  };

  // KPI Computations
  const totalTransfersCount = transfers.length;
  const inTransitCount = transfers.filter((t) => t.status === 'IN_TRANSIT').length;
  const receivedCount = transfers.filter((t) => t.status === 'RECEIVED').length;
  const totalTransitLossKg = transfers.reduce((sum, t) => sum + Number(t.transitLossWeightKg || 0), 0);
  const totalDispatchedWeightKg = transfers.reduce((sum, t) => sum + Number(t.totalWeightKg || 0), 0);

  // Filtered transfers
  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromWarehouse?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toWarehouse?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.biltyNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesWh =
      !warehouseFilter || t.fromWarehouseId === warehouseFilter || t.toWarehouseId === warehouseFilter;

    return matchesSearch && matchesStatus && matchesWh;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-[#087A55]/10 text-[#087A55] rounded-xl">
              <ArrowLeftRight className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#172B25]">Warehouse Logistics & Stock Transfers</h1>
              <p className="text-xs text-[#718078]">
                Inter-Godown Dispatch, In-Transit Freight, Weighbridge Arrival Verification & Physical Reconciliation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsReconcileModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-[#087A55] bg-[#087A55]/10 hover:bg-[#087A55]/20 rounded-xl transition-all flex items-center"
          >
            <Scale className="w-4 h-4 mr-1.5" />
            Physical Stock Audit
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#087A55] hover:bg-[#064E3B] rounded-xl shadow-xs transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Dispatch Transfer
          </button>
          <button
            onClick={loadData}
            className="p-2 text-[#718078] hover:text-[#172B25] hover:bg-gray-100 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>Total Transfers</span>
            <ArrowLeftRight className="w-4 h-4 text-[#087A55]" />
          </div>
          <div className="text-2xl font-bold text-[#172B25]">{totalTransfersCount}</div>
          <span className="text-[11px] text-[#718078]">
            {totalDispatchedWeightKg.toLocaleString()} Kg Dispatched
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>In-Transit On Road</span>
            <Truck className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{inTransitCount}</div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting Destination Arrival</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>Received & Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#087A55]">{receivedCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Stock Inward Verified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4EAE5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#718078] mb-1">
            <span>Transit Shortage Loss</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{totalTransitLossKg.toLocaleString()} Kg</div>
          <span className="text-[11px] text-red-600 font-medium">Audited as Wastage</span>
        </div>
      </div>

      {/* Main Transfers Table & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4EAE5] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transfer #, route, driver, bilty..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E4EAE5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087A55]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="text-xs border border-[#E4EAE5] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#087A55] bg-white text-[#172B25]"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-[#E4EAE5] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#087A55] bg-white text-[#172B25]"
            >
              <option value="">All Statuses</option>
              <option value="IN_TRANSIT">In-Transit</option>
              <option value="RECEIVED">Received</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold uppercase tracking-wider border-b border-[#E4EAE5]">
              <tr>
                <th className="py-3 px-4">Transfer # & Date</th>
                <th className="py-3 px-4">Route (Origin &rarr; Destination)</th>
                <th className="py-3 px-4">Freight & Vehicle</th>
                <th className="py-3 px-4 text-right">Dispatched Qty</th>
                <th className="py-3 px-4 text-right">Received Qty</th>
                <th className="py-3 px-4 text-right">Transit Loss</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No warehouse transfers found.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#172B25] block">{trf.transferNumber}</span>
                      <span className="text-[11px] text-[#718078]">
                        {new Date(trf.transferDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 font-medium text-[#172B25]">
                        <span>{trf.fromWarehouse?.name}</span>
                        <span className="text-gray-400">&rarr;</span>
                        <span className="text-[#087A55] font-semibold">{trf.toWarehouse?.name}</span>
                      </div>
                      <span className="text-[10px] text-[#718078] block">
                        {trf.items?.map((i) => i.product?.name).join(', ') || 'Rice Items'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#172B25] block">
                        {trf.vehicleNumber || 'Unassigned'} {trf.driverName ? `(${trf.driverName})` : ''}
                      </span>
                      <span className="text-[10px] text-[#718078] font-mono">
                        Bilty: {trf.biltyNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-[#172B25] block">{trf.totalBags} Bags</span>
                      <span className="text-[10px] text-[#718078]">
                        {Number(trf.totalWeightKg).toLocaleString()} Kg
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {trf.status === 'RECEIVED' ? (
                        <>
                          <span className="font-bold text-[#087A55] block">
                            {trf.items?.reduce((s, i) => s + (Number(i.receivedBags) || 0), 0)} Bags
                          </span>
                          <span className="text-[10px] text-[#718078]">
                            {trf.items
                              ?.reduce((s, i) => s + (Number(i.receivedWeightKg) || 0), 0)
                              .toLocaleString()}{' '}
                            Kg
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">In-Transit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {Number(trf.transitLossWeightKg) > 0 ? (
                        <span className="font-bold text-[#DC5050]">
                          -{Number(trf.transitLossWeightKg).toFixed(1)} Kg ({trf.transitLossBags} bags)
                        </span>
                      ) : trf.status === 'RECEIVED' ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">0 Kg (Exact)</span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          trf.status === 'RECEIVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trf.status === 'IN_TRANSIT'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {trf.status === 'IN_TRANSIT' ? (
                          <Clock className="w-3 h-3 mr-1" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {trf.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {trf.status === 'IN_TRANSIT' ? (
                        <button
                          onClick={() => openReceiveModal(trf)}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#087A55] text-white hover:bg-[#064E3B] rounded-lg shadow-2xs transition-all flex items-center mx-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Receive & Verify
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Confirmed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateWarehouseTransferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTransfer}
        warehouses={warehouses}
        products={products}
      />

      <ReceiveTransferModal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setSelectedTransferForReceive(null);
        }}
        onSubmit={handleReceiveTransfer}
        transfer={selectedTransferForReceive}
      />

      <StockReconciliationModal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        onSubmit={handleReconcileStock}
        warehouses={warehouses}
        products={products}
      />
    </div>
  );
};
