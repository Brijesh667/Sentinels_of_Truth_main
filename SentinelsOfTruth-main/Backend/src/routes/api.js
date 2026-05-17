import { Router } from "express";
import { verify, getSuggestions, getProviders, health } from "../controllers/verifyController.js";

const router = Router();

router.post("/verify", verify);
router.post("/suggestions", getSuggestions);
router.get("/providers", getProviders);
router.get("/health", health);

export default router;
