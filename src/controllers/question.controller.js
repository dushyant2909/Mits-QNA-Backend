import { Question } from "../models/question.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Tag } from "../models/tag.model.js";


const askQuestion = asyncHandler(async (req, res) => {
    const { title, description, slug, tags } = req.body;

    if (!title || !description || !slug) {
        throw new ApiError(401, "All fields are required");
    }
    if (tags.length == 0)
        throw new ApiError(401, "Please add tags also");

    const tagIds = [];
    for (const tagName of tags) {
        const existingTag = await Tag.findOne({ tagName });
        if (existingTag) {
            tagIds.push(existingTag._id);
        } else {
            const newTag = await Tag.create({ tagName });
            tagIds.push(newTag._id);
        }
    }

    const userId = req.user?._id;

    const questionDetail = await Question.create({
        title,
        description,
        slug,
        tags: tagIds,
        publishedBy: userId
    })

    if (!questionDetail)
        throw new ApiError(500, "Something went wrong while adding question to database")

    return res.status(200)
        .json(new ApiResponse(200, questionDetail, "Question added successfully"));
})

export { askQuestion }