package com.divya.bankingsystem.controller;

import com.divya.bankingsystem.dto.response.TransactionResponse;
import com.divya.bankingsystem.entity.Transaction;
import com.divya.bankingsystem.service.TransactionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> getTransactions(Pageable pageable) {
        return ResponseEntity.ok(transactionService.getTransactions(pageable)); // 200
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<Page<TransactionResponse>> getTransactionsByAccountId(@PathVariable Long accountId, Pageable pageable) {
        return ResponseEntity.ok(transactionService.getTransactionsByAccountId(accountId, pageable)); // 200
    }
}