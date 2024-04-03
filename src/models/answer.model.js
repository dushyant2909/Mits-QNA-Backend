import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
    {
        body: {
            type: String,
            required: [true, "Answer body is required"]
        },
        answeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        },
        voteCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
)

export const Answer = mongoose.model("Answer", answerSchema);