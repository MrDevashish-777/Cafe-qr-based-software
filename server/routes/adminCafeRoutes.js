const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const adminCafeController = require("../controllers/adminCafeController");

router.use(requireAuth);
router.use(requireRole(["cafe_admin", "super_admin"]));

router.get("/", adminCafeController.getCafe);
router.get("/analytics", adminCafeController.getAnalytics);
router.get("/non-smoking-images", adminCafeController.getNonSmokingImages);
router.patch("/", adminCafeController.updateCafe);
router.patch("/non-smoking-images", adminCafeController.updateNonSmokingImages);

module.exports = router;
