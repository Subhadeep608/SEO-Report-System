const mongoose = require("mongoose");

const rankingEntrySchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true, trim: true },
    // Kept as a string, not a number, since ranks can be text like "Not in Top 100"
    rank: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const rankingReportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    entries: {
      type: [rankingEntrySchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedByName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RankingReport", rankingReportSchema);