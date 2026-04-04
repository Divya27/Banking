package com.divya.bankingsystem.dto.response;

import com.divya.bankingsystem.entity.Transaction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class TransactionResponse {

    private Long transactionId;
    private Long fromAccountId;
    private Long toAccountId;
    private Double amount;
    private String status;
    private String type;
    private Transaction.TransactionCategory transactionCategory;
    private String description;
    private LocalDateTime timestamp;

}
