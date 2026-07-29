const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    // Snapshot of the project's keyword at submission time, so historical
    // reports stay accurate even if the keyword is changed later.
    keyword: {
      type: String,
      trim: true,
      default: "",
    },
    workUrl: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Denormalized so admin's report table doesn't need extra lookups
    submittedByName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // createdAt = date & time of submission
);

module.exports = mongoose.model("Report", reportSchema);
