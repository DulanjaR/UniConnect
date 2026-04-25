import express from "express";
import Claim from "../models/Claim.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// CREATE CLAIM
router.post("/", authMiddleware, upload.single("idCardImage"), async (req, res) => {
  try {
    const { itemId, name, studentId, email } = req.body;

    const existingClaim = await Claim.findOne({
      itemId,
      userId: req.user.userId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingClaim) {
      return res.status(400).json({
        message: "You already submitted a claim for this item",
      });
    }

    const claim = new Claim({
      itemId,
      userId: req.user.userId,
      name,
      studentId,
      email,
      idCardImage: req.file ? req.file.path : "",
      status: "pending",
    });

    await claim.save();

    const populatedClaim = await Claim.findById(claim._id)
      .populate("itemId", "title itemType category location images status")
      .populate("userId", "name email");

    res.status(201).json(populatedClaim);
  } catch (err) {
    console.error("Create claim error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET CLAIM BY ITEM
router.get("/item/:itemId", async (req, res) => {
  try {
    const claim = await Claim.findOne({ itemId: req.params.itemId })
      .sort({ createdAt: -1 })
      .populate("itemId", "title itemType category location images status")
      .populate("userId", "name email");

    res.json(claim);
  } catch (err) {
    console.error("Get claim error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET ALL CLAIMS (admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const claims = await Claim.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("itemId", "title itemType category location images status")
      .populate("userId", "name email");

    const total = await Claim.countDocuments(filter);

    res.json({
      claims,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    console.error("Get all claims error:", err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE CLAIM STATUS (admin only) - Generic endpoint for approve/reject
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("itemId", "title itemType category location images status")
      .populate("userId", "name email");

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    res.json(claim);
  } catch (err) {
    console.error("Update claim error:", err);
    res.status(500).json({ message: err.message });
  }
});

// APPROVE CLAIM (kept for backwards compatibility)
router.put("/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    )
      .populate("itemId", "title itemType category location images status")
      .populate("userId", "name email");

    res.json(claim);
  } catch (err) {
    console.error("Approve claim error:", err);
    res.status(500).json({ message: err.message });
  }
});

// REJECT CLAIM (kept for backwards compatibility)
router.put("/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    )
      .populate("itemId", "title itemType category location images status")
      .populate("userId", "name email");

    res.json(claim);
  } catch (err) {
    console.error("Reject claim error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;