import express from "express";
import Claim from "../models/Claim.js";
import { authMiddleware } from "../middleware/auth.js";
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

// GET ALL CLAIMS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const claims = await Claim.find()
      .sort({ createdAt: -1 })
      .populate("itemId", "title itemType category location images status")
      .populate("userId", "name email");

    res.json(claims);
  } catch (err) {
    console.error("Get all claims error:", err);
    res.status(500).json({ message: err.message });
  }
});

// APPROVE CLAIM
router.put("/:id/approve", authMiddleware, async (req, res) => {
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

// REJECT CLAIM
router.put("/:id/reject", authMiddleware, async (req, res) => {
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