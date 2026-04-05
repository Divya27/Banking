package com.divya.bankingsystem.controller;

import com.divya.bankingsystem.dto.request.DepositRequest;
import com.divya.bankingsystem.dto.request.PaymentOrderRequest;
import com.divya.bankingsystem.entity.Transaction;
import com.divya.bankingsystem.service.AccountService;
import com.divya.bankingsystem.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final AccountService accountService;

    // endpoint for create order
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody PaymentOrderRequest request) {
        try {
            // no manual parsing needed, Spring Boot maps JSON directly to DTO fields
            Map<String, Object> response = paymentService.createOrder(request.getAmount(),
                    request.getAccountId(),
                    request.getCurrency());
            return ResponseEntity.ok(response);
        } catch(Exception e) {
            return ResponseEntity.badRequest()
                    .body("Failed to create order :" + e.getMessage());

        }
    }

    // endpoint to verify payment signature, react calls this after user completes payment, this verifies signature → updates balance
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> request) {
        try {
            String orderId   = request.get("razorpay_order_id").toString();
            String paymentId = request.get("razorpay_payment_id").toString();
            String signature = request.get("razorpay_signature").toString();
            Long accountId   = Long.parseLong(request.get("accountId").toString());
            double amount    = Double.parseDouble(request.get("amount").toString());

            // Step 1 — verify signature
            Map<String, Object> result = paymentService.verifyPayment(
                    orderId, paymentId, signature, accountId, amount
            );

            // Step 2 — build deposit request
            DepositRequest depositRequest = new DepositRequest();
            depositRequest.setAmount(amount);

            depositRequest.setCategory(
                    request.get("category") != null
                            ? Transaction.TransactionCategory.valueOf(request.get("category").toString().toUpperCase())
                            : Transaction.TransactionCategory.OTHER
            );
            depositRequest.setDescription(
                    request.get("description") != null
                            ? request.get("description").toString()
                            : "Razorpay payment - " + paymentId
            );

            // Step 3 — update balance
            accountService.deposit(accountId, depositRequest);

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid payment signature.");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Verification failed: " + e.getMessage());
        }
    }
}
