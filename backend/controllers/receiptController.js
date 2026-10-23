import fs from 'fs';
import path from 'path';
import multer from 'multer';
import Receipt from '../models/Receipt.js';
import Transaction from '../models/Transaction.js';

// Ensure uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

// File validation filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
}).single('receipt');

// Heuristic Receipt Text Parser
export const parseReceiptText = (rawText) => {
  const text = (rawText || '').trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let merchant = 'Unknown Merchant';
  let amount = 0;
  let date = new Date();
  let currency = 'INR';
  let category = 'Other';

  if (lines.length > 0) {
    // Top lines usually contain merchant name
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (lines[i].length > 2 && !lines[i].match(/receipt|invoice|bill|tax|order|date|tel|phone/i)) {
        merchant = lines[i].replace(/[#*=:_-]/g, '').trim();
        break;
      }
    }
  }

  // Known brand detectors
  const lower = text.toLowerCase();
  if (lower.includes('starbucks') || lower.includes('costa') || lower.includes('cafe')) {
    merchant = merchant === 'Unknown Merchant' ? 'Starbucks Coffee' : merchant;
    category = 'Food & Dining';
  } else if (lower.includes('mcdonald') || lower.includes('burger') || lower.includes('subway') || lower.includes('domino') || lower.includes('pizza') || lower.includes('swiggy') || lower.includes('zomato')) {
    category = 'Food & Dining';
  } else if (lower.includes('amazon') || lower.includes('walmart') || lower.includes('target') || lower.includes('flipkart') || lower.includes('zara') || lower.includes('h&m')) {
    category = 'Shopping';
  } else if (lower.includes('uber') || lower.includes('ola') || lower.includes('lyft') || lower.includes('petrol') || lower.includes('fuel') || lower.includes('shell') || lower.includes('metro')) {
    category = 'Transport';
  } else if (lower.includes('pharmacy') || lower.includes('hospital') || lower.includes('clinic') || lower.includes('medical') || lower.includes('apollo')) {
    category = 'Healthcare';
  } else if (lower.includes('electricity') || lower.includes('water') || lower.includes('broadband') || lower.includes('wifi') || lower.includes('airtel') || lower.includes('jio')) {
    category = 'Utilities';
  }

  // Detect Currency
  if (text.includes('₹') || lower.includes('inr') || lower.includes('rs.') || lower.includes('rupees')) {
    currency = 'INR';
  } else if (text.includes('$') || lower.includes('usd')) {
    currency = 'USD';
  } else if (text.includes('€') || lower.includes('eur')) {
    currency = 'EUR';
  } else if (text.includes('£') || lower.includes('gbp')) {
    currency = 'GBP';
  }

  // Extract Total Amount
  // Matches "Total: $45.50", "Grand Total: 1,250.00", "Amount Due: ₹850", etc.
  const totalRegexes = [
    /(?:grand\s*total|total\s*amount|total|net\s*amount|amount\s*due|amount\s*payable|bal(?:ance)?\s*due)[\s:=₹$€£a-z]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i,
    /(?:₹|\$|€|£)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/,
  ];

  for (const regex of totalRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanNum = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) {
        amount = cleanNum;
        break;
      }
    }
  }

  // Extract Date
  const dateRegexes = [
    /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/, // DD-MM-YYYY or MM-DD-YYYY
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
  ];

  for (const regex of dateRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate.getTime()) && parsedDate <= new Date()) {
        date = parsedDate;
        break;
      }
    }
  }

  return {
    merchant: merchant.slice(0, 50),
    amount: Math.round(amount * 100) / 100,
    date,
    currency,
    category,
    confidence: amount > 0 && merchant !== 'Unknown Merchant' ? 85 : 50,
  };
};

// Check for potential duplicate transactions or receipts
export const checkDuplicate = async (userId, amount, date) => {
  if (!amount || amount <= 0) return { isDuplicate: false, reason: '' };

  const targetDate = new Date(date || new Date());
  const minDate = new Date(targetDate);
  minDate.setDate(minDate.getDate() - 2);
  const maxDate = new Date(targetDate);
  maxDate.setDate(maxDate.getDate() + 2);

  const existingTx = await Transaction.findOne({
    userId,
    type: 'expense',
    amount,
    date: { $gte: minDate, $lte: maxDate },
  });

  if (existingTx) {
    return {
      isDuplicate: true,
      reason: `A recorded transaction for ₹${amount.toLocaleString()} on ${new Date(existingTx.date).toISOString().slice(0, 10)} (${existingTx.category}: "${existingTx.description}") was already found.`,
    };
  }

  const existingReceipt = await Receipt.findOne({
    userId,
    status: 'confirmed',
    'extractedData.amount': amount,
    'extractedData.date': { $gte: minDate, $lte: maxDate },
  });

  if (existingReceipt) {
    return {
      isDuplicate: true,
      reason: `A confirmed receipt from ${existingReceipt.extractedData.merchant} for ₹${amount.toLocaleString()} has already been processed.`,
    };
  }

  return { isDuplicate: false, reason: '' };
};

// @desc    Upload receipt and run OCR extraction
// @route   POST /api/receipts/upload
// @access  Private
export const uploadAndScanReceipt = async (req, res, next) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a receipt image or document' });
    }

    try {
      const filePath = req.file.path;
      let rawText = '';
      let ocrSuccess = false;

      // Attempt OCR with Tesseract.js if image
      if (req.file.mimetype.startsWith('image/')) {
        try {
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');
          const ret = await worker.recognize(filePath);
          rawText = ret.data.text || '';
          await worker.terminate();
          ocrSuccess = true;
        } catch (ocrErr) {
          console.warn('Tesseract OCR failed, using fallback heuristic parser:', ocrErr.message);
        }
      }

      // If OCR produced no text, supply a baseline template text
      if (!rawText.trim()) {
        rawText = `Receipt: ${req.file.originalname}\nDate: ${new Date().toISOString().slice(0, 10)}\nTotal: 0.00`;
      }

      const extracted = parseReceiptText(rawText);
      const duplicateInfo = await checkDuplicate(req.user._id, extracted.amount, extracted.date);

      const receipt = await Receipt.create({
        userId: req.user._id,
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        extractedData: {
          merchant: extracted.merchant,
          date: extracted.date,
          amount: extracted.amount,
          currency: extracted.currency,
          category: extracted.category,
          rawText,
          confidence: extracted.confidence,
        },
        status: 'pending_review',
        isDuplicate: duplicateInfo.isDuplicate,
        duplicateReason: duplicateInfo.reason,
      });

      return res.status(201).json({
        success: true,
        message: 'Receipt uploaded and parsed successfully. Please review details before saving.',
        data: receipt,
      });
    } catch (processError) {
      next(processError);
    }
  });
};

// @desc    Get all receipts for authenticated user
// @route   GET /api/receipts
// @access  Private
export const getReceipts = async (req, res, next) => {
  try {
    const receipts = await Receipt.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: receipts.length,
      data: receipts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Securely stream uploaded receipt file (never public)
// @route   GET /api/receipts/:id/file
// @access  Private
export const getReceiptFile = async (req, res, next) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found or unauthorized' });
    }

    const filePath = path.resolve(uploadDir, receipt.storedFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Receipt file no longer exists on storage' });
    }

    res.setHeader('Content-Type', receipt.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${receipt.originalFilename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm reviewed receipt and add as real expense transaction
// @route   POST /api/receipts/:id/confirm
// @access  Private
export const confirmReceiptExpense = async (req, res, next) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found or unauthorized' });
    }

    const { merchant, amount, category, date, description } = req.body;

    const finalAmount = Number(amount !== undefined ? amount : receipt.extractedData.amount);
    const finalMerchant = merchant || receipt.extractedData.merchant || 'Scanned Receipt';
    const finalCategory = category || receipt.extractedData.category || 'Other';
    const finalDate = date ? new Date(date) : receipt.extractedData.date || new Date();
    const finalDesc = description || `Receipt: ${finalMerchant}`;

    if (isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required to save expense' });
    }

    // 1. Create real transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'expense',
      amount: finalAmount,
      category: finalCategory,
      description: finalDesc,
      date: finalDate,
    });

    // 2. Update receipt status
    receipt.status = 'confirmed';
    receipt.transactionId = transaction._id;
    receipt.extractedData.merchant = finalMerchant;
    receipt.extractedData.amount = finalAmount;
    receipt.extractedData.category = finalCategory;
    receipt.extractedData.date = finalDate;
    await receipt.save();

    return res.json({
      success: true,
      message: `Confirmed expense of ₹${finalAmount.toLocaleString()} added to Transactions.`,
      data: {
        receipt,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete receipt
// @route   DELETE /api/receipts/:id
// @access  Private
export const deleteReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found or unauthorized' });
    }

    // Delete stored file from disk
    const filePath = path.resolve(uploadDir, receipt.storedFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileErr) {
        console.warn('Could not remove receipt file from disk:', fileErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
