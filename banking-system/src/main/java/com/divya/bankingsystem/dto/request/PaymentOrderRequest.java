package com.divya.bankingsystem.dto.request;

import lombok.Data;

@Data
public class PaymentOrderRequest {

    private double amount;
    private Long accountId;
    private String currency = "INR";        // default
}
