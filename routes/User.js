import express from "express"
import { allUsers, authUser, registerUser } from "../controllers/User.js";
import { protect } from "../middlewares/auth.js";

const router  = express.Router();

router.route("/").post(registerUser).get(protect,allUsers)


router.post("/login", authUser)

export default router