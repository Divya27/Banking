package com.divya.bankingsystem.dto.request;

import com.divya.bankingsystem.entity.Transaction;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class DepositRequest {

    @Positive
    private Double amount;
    private Transaction.TransactionCategory category;
    private String description;
}
