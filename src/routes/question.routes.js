import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { askQuestion, getAllQuestions } from "../controllers/question.controller.js";

const questionRoutes = Router();


questionRoutes.route('/getAllQuestions').get(getAllQuestions)

questionRoutes.use(verifyJWT)

questionRoutes.route('/add-question').post(askQuestion);

export default questionRoutes;