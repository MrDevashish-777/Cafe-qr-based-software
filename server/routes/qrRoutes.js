const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qrController");

router.get("/table", qrController.tableQr);
router.get("/verify", qrController.verifyTableToken);
router.get("/token", qrController.tableToken);

module.exports = router;
