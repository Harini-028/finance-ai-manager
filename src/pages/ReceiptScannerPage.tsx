import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ScanLine, UploadCloud, CheckCircle2,
  AlertTriangle, ShieldCheck, Trash2, Eye, X,
  RefreshCw, Receipt,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatDate } from '../lib/format';
import { categories } from '../lib/constants';

type ScannedReceipt = {
  _id: string;
  originalFilename: string;
  storedFilename: string;
  fileSize: number;
  mimeType: string;
  extractedData: {
    merchant: string;
    date: string;
    amount: number;
    currency: string;
    category: string;
    rawText: string;
    confidence: number;
  };
  status: 'pending_review' | 'confirmed' | 'discarded';
  isDuplicate: boolean;
  duplicateReason: string;
  createdAt: string;
};

export default function ReceiptScannerPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'INR';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [receipts, setReceipts] = useState<ScannedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Active receipt under review
  const [activeReceipt, setActiveReceipt] = useState<ScannedReceipt | null>(null);
  const [reviewForm, setReviewForm] = useState({
    merchant: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  // Modal to preview image securely
  const [previewReceiptId, setPreviewReceiptId] = useState<string | null>(null);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/receipts');
      if (res.data?.success) {
        setReceipts(res.data.data || []);
      }
    } catch (err: any) {
      console.warn('Could not load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify('warning', 'Receipt file size must be less than 5 MB');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    setUploading(true);
    setUploadProgress('Uploading receipt to secure storage...');

    try {
      setUploadProgress('Running OCR text extraction & scanning total...');
      const res = await api.post('/api/receipts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data) {
        notify('success', 'Receipt processed! Please review details before saving.');
        const rec: ScannedReceipt = res.data.data;
        setActiveReceipt(rec);
        setReviewForm({
          merchant: rec.extractedData?.merchant || '',
          amount: rec.extractedData?.amount ? rec.extractedData.amount.toString() : '',
          category: rec.extractedData?.category || 'Other',
          date: rec.extractedData?.date ? rec.extractedData.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          description: `Receipt from ${rec.extractedData?.merchant || 'merchant'}`,
        });
        await loadReceipts();
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      notify('error', err.response?.data?.message || 'Receipt scan failed. Please verify format.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReceipt) return;

    const amount = parseFloat(reviewForm.amount);
    if (!reviewForm.merchant.trim() || isNaN(amount) || amount <= 0) {
      notify('warning', 'Please provide a valid merchant and positive amount');
      return;
    }

    try {
      const res = await api.post(`/receipts/${activeReceipt._id}/confirm`, {
        merchant: reviewForm.merchant.trim(),
        amount,
        category: reviewForm.category,
        date: reviewForm.date,
        description: reviewForm.description.trim(),
      });

      notify('success', res.data?.message || 'Expense confirmed and added to your transactions');
      setActiveReceipt(null);
      await loadReceipts();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to confirm expense');
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!window.confirm('Delete this receipt record and associated image?')) return;
    try {
      await api.delete(`/receipts/${id}`);
      notify('success', 'Receipt deleted');
      if (activeReceipt?._id === id) setActiveReceipt(null);
      await loadReceipts();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to delete receipt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl gradient-brand text-white shadow-soft">
              <ScanLine className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
              Smart Receipt Scanner
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Extract merchant, date, total amount, and category using intelligent OCR with explicit user review
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>Private Encrypted Storage · No Public Access</span>
        </div>
      </div>

      {/* Safety Notice: Confirmation Required */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs text-ink-700 dark:text-ink-300">
        <Receipt className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-brand-700 dark:text-brand-300">Human-In-The-Loop Expense Verification: </span>
          Receipts are scanned and presented in an editable review form for your confirmation. Transactions are never created automatically without your explicit approval.
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`card p-8 border-2 border-dashed text-center cursor-pointer transition-all ${
          uploading
            ? 'border-brand-500 bg-brand-500/5 cursor-wait'
            : 'border-ink-200 dark:border-ink-800 hover:border-brand-500 hover:bg-ink-50/50 dark:hover:bg-ink-850/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3 shadow-soft">
          {uploading ? <RefreshCw className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
        </div>

        {uploading ? (
          <div className="space-y-2">
            <h3 className="font-display font-bold text-base text-ink-900 dark:text-white">{uploadProgress}</h3>
            <p className="text-xs text-ink-400">Processing optical character recognition...</p>
          </div>
        ) : (
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-ink-900 dark:text-white">
              Drop receipt image here, or <span className="text-brand-500">browse file</span>
            </h3>
            <p className="text-xs text-ink-400">
              Supports JPEG, PNG, WebP, and PDF (Max 5 MB)
            </p>
          </div>
        )}
      </div>

      {/* Active Review Form (when a receipt has been parsed) */}
      {activeReceipt && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 border-2 border-brand-500/30 bg-white dark:bg-ink-900 shadow-soft space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-ink-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Step 2: Review Extracted Details
              </span>
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white mt-0.5">
                Verify Receipt Information
              </h3>
            </div>
            <button
              onClick={() => setActiveReceipt(null)}
              className="text-ink-400 hover:text-ink-700 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Duplicate Warning if flagged */}
          {activeReceipt.isDuplicate && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span className="font-bold">Possible Duplicate Detected: </span>
                <span>{activeReceipt.duplicateReason}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleConfirmExpense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Merchant Name *</label>
                <input
                  required
                  value={reviewForm.merchant}
                  onChange={(e) => setReviewForm({ ...reviewForm, merchant: e.target.value })}
                  placeholder="e.g. Starbucks Coffee"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Total Amount ({currency}) *</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={reviewForm.amount}
                  onChange={(e) => setReviewForm({ ...reviewForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="input-field text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Category *</label>
                <select
                  value={reviewForm.category}
                  onChange={(e) => setReviewForm({ ...reviewForm, category: e.target.value })}
                  className="input-field text-sm"
                >
                  {categories
                    .filter((c) => c.type === 'expense' || c.type === 'both')
                    .map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={reviewForm.date}
                  onChange={(e) => setReviewForm({ ...reviewForm, date: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Description / Notes</label>
              <input
                value={reviewForm.description}
                onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                placeholder="e.g. Team lunch receipt"
                className="input-field text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="btn-secondary flex-1"
              >
                Discard
              </button>
              <button type="submit" className="btn-primary flex-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Add to Expenses</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Receipts History Table */}
      <div className="card p-5 border border-ink-100 dark:border-ink-800">
        <h3 className="font-display font-bold text-base text-ink-900 dark:text-white mb-4">
          Scanned Receipts History ({receipts.length})
        </h3>

        {receipts.length === 0 ? (
          <p className="text-center text-sm text-ink-400 py-8">
            No receipts scanned yet. Upload your first paper bill or digital invoice above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Merchant</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">File</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {receipts.map((rec) => {
                  const isConfirmed = rec.status === 'confirmed';

                  return (
                    <tr key={rec._id} className="hover:bg-ink-50/50 dark:hover:bg-ink-850/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-ink-900 dark:text-white">
                        {rec.extractedData?.merchant || 'Unknown'}
                      </td>
                      <td className="py-3 px-3 text-ink-500 dark:text-ink-400">
                        {rec.extractedData?.date ? formatDate(rec.extractedData.date) : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-ink-600 dark:text-ink-300">
                        {rec.extractedData?.category || 'Other'}
                      </td>
                      <td className="py-3 px-3 font-bold text-ink-900 dark:text-white">
                        {formatCurrency(rec.extractedData?.amount || 0, currency)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            isConfirmed
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-ink-400 truncate max-w-[140px]">
                        {rec.originalFilename}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewReceiptId(rec._id)}
                            title="View receipt file"
                            className="p-1 rounded text-ink-400 hover:text-ink-700 dark:hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isConfirmed && (
                            <button
                              onClick={() => {
                                setActiveReceipt(rec);
                                setReviewForm({
                                  merchant: rec.extractedData?.merchant || '',
                                  amount: rec.extractedData?.amount?.toString() || '',
                                  category: rec.extractedData?.category || 'Other',
                                  date: rec.extractedData?.date ? rec.extractedData.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                                  description: `Receipt from ${rec.extractedData?.merchant || 'merchant'}`,
                                });
                              }}
                              className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-[11px]"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReceipt(rec._id)}
                            className="p-1 rounded text-error-400 hover:text-error-600"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Secure Receipt File Preview Modal */}
      {previewReceiptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl card p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-ink-800">
              <h3 className="font-display font-bold text-base text-ink-900 dark:text-white">
                Receipt File Preview (Encrypted Stream)
              </h3>
              <button onClick={() => setPreviewReceiptId(null)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto py-4 flex items-center justify-center bg-ink-50 dark:bg-ink-950 rounded-xl">
              <img
                src={`http://localhost:5000/api/receipts/${previewReceiptId}/file`}
                alt="Receipt Preview"
                className="max-h-[60vh] object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
            </div>

            <div className="pt-3 border-t border-ink-100 dark:border-ink-800 text-right">
              <button onClick={() => setPreviewReceiptId(null)} className="btn-secondary text-xs">
                Close Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
