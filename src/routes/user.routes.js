import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getCurrentUser, login, logout, registerUser } from "../controllers/user.controller.js";

const userRoutes = Router();

userRoutes.route("/register").post(
    registerUser
)

userRoutes.route("/login").post(login)
userRoutes.route("/logout").post(verifyJWT, logout)
userRoutes.route("/getCurrentUser").get(verifyJWT, getCurrentUser)

export default userRoutes;