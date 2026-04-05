package com.divya.bankingsystem.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    // take razorpay keys
    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    // create a razorpay order, called before opening a payment pop-up

    public Map<String, Object> createOrder(double amount, Long accountId, String currency)
        throws RazorpayException {
            // razorpay expects it in lowest currency unit - INR - paisa

            int amountInPaisa = (int) amount  * 100;

            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaisa);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", "txn_" + accountId + "_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1);

            Order order = razorpay.orders.create(orderRequest);
            System.out.println(order);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("keyId", keyId);

            return response;

    }

    // verify the payment signature, to ensure payment is genuine

    public Map<String, Object> verifyPayment(String orderId,
                                             String paymentId,
                                             String signature,
                                             Long accountId,
                                             double amount) throws Exception {
        // verify signature
        // Razorpay signature = HMAC-SHA256(orderId + "|" + paymentId, secretKey)
        String payload       = orderId + "|" + paymentId;
        String generatedSign = hmacSHA256(payload, keySecret);

        if (!generatedSign.equals(signature)) {
            throw new IllegalArgumentException("Invalid payment signature.");
        }

        // if signature is valid, return success response
        Map<String, Object> response = new HashMap<>();
        response.put("success",   true);
        response.put("paymentId", paymentId);
        response.put("accountId", accountId);
        response.put("amount",    amount);
        response.put("message",   "Payment verified successfully");

        return response;
    }

    // helper method to create signature
    private String hmacSHA256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(
                secret.getBytes("UTF-8"), "HmacSHA256"
        );
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes("UTF-8"));

        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
