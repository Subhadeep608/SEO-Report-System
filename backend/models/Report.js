const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    websiteUrl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WebsiteUrl",
      required: true,
    },
    // Snapshot of the URL string at submission time, so historical reports
    // stay accurate even if the WebsiteUrl entry is edited/disabled later.
    workUrl: {
      type: String,
      required: true,
      trim: true,
    },
    // The single keyword the user picked from that URL's keyword list
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    // The actual URL of completed work the user pastes in when submitting.
    // Checked for duplicates within the same project.
    workingUrl: {
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
    submittedByName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);