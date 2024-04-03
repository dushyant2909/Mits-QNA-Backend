import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        },
        answer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Answer"
        },
        voteType: {
            type: String,
            enum: ["upvote", "downvote"]
        }
    },
    {
        timestamps: true
    }
)

export const Vote = mongoose.model("Vote", voteSchema);