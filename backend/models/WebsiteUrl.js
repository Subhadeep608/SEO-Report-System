const mongoose = require("mongoose");

const websiteUrlSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        url: {
            type: String,
            required: true,
            trim: true,
        },
        // The list of keywords a user can pick from once they select this URL
        keywords: [
            {
                type: String,
                trim: true,
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("WebsiteUrl", websiteUrlSchema);