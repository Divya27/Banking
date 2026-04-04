package com.divya.bankingsystem.dto.request;

import com.divya.bankingsystem.entity.Transaction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class TransactionRequest {

    @NotNull
    private Long fromAccountId;
    @NotNull
    private Long toAccountId;

    @NotNull
    @Positive
    private Double amount;

    private Transaction.TransactionCategory category;
    private String description;
}
