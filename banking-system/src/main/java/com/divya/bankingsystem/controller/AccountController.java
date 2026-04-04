package com.divya.bankingsystem.controller;

import com.divya.bankingsystem.dto.request.WithdrawRequest;
import com.divya.bankingsystem.dto.response.AccountResponse;
import com.divya.bankingsystem.dto.request.CreateAccountRequest;
import com.divya.bankingsystem.dto.request.DepositRequest;
import com.divya.bankingsystem.dto.request.TransactionRequest;
import com.divya.bankingsystem.dto.response.TransactionResponse;
import com.divya.bankingsystem.entity.Account;
import com.divya.bankingsystem.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(@RequestBody CreateAccountRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<Account>> getAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts()); // 200
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccountById(id)); // 200
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<AccountResponse> deposit(@PathVariable Long id, @RequestBody DepositRequest request) {
        AccountResponse response = accountService.deposit(id, request);
        return ResponseEntity.ok(response); // 200
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<AccountResponse> withdraw(@PathVariable Long id, @RequestBody WithdrawRequest request) {
        AccountResponse response = accountService.withdraw(id, request);
        return ResponseEntity.ok(response); // 200
    }

    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(@RequestBody TransactionRequest request) {
        TransactionResponse response = accountService.transfer(request);
        return ResponseEntity.ok(response); // 200
    }
}
