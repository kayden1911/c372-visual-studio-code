const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
router.post(
    '/payments/mock/:serviceId',
    paymentController.createMockPayment
);

router.get('/payments/prepare/:serviceId', paymentController.preparePayment);

module.exports = router;
