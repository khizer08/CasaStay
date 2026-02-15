const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook");

router.post("/", webhookController.handleRazorpayWebhook);

module.exports = router;
