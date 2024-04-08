import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { askQuestion } from "../controllers/question.controller.js";

const questionRoutes = Router();

questionRoutes.use(verifyJWT)

questionRoutes.route('/add-question').post(askQuestion);

export default questionRoutes;