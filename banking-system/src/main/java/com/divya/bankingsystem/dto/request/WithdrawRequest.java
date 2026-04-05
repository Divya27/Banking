package com.divya.bankingsystem.dto.request;

import com.divya.bankingsystem.entity.Transaction;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WithdrawRequest {

    @NotNull
    private Double amount;
    private Transaction.TransactionCategory category;
    private String description;
}
