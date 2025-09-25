import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { onboard } from "../controllers/auth.controller.js"; 
import {logout,login,signup} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);
router.post("/onboarding",protectRoute,onboard);

//forgot-password
//send-reset-password-mail

router.get("/me",protectRoute,(req,res)=>{
  res.status(200).json({success:true,user:req.user});
});

export default router;