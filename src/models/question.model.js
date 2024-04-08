import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Question title is required"]
        },
        slug: {
            type: String
        },
        description: {
            type: String,
            required: [true, "Question description is required"]
        },
        publishedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tag"
            }
        ],
        voteCount: {
            type: Number,
            default: 0
        },
        viewCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
)

export const Question = mongoose.model("Question", questionSchema)