import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
    {
        tagName: {
            type: String,
            required: true,
            unique: true,
            index:true,
            trim:true,
            lowercase:true
        },

    },
    { timestamps: true }
)

export const Tag = mongoose.model("Tag", tagSchema);