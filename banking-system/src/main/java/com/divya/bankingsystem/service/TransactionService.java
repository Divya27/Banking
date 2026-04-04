package com.divya.bankingsystem.service;

import com.divya.bankingsystem.dto.response.TransactionResponse;
import com.divya.bankingsystem.entity.Account;
import com.divya.bankingsystem.entity.Transaction;
import com.divya.bankingsystem.entity.User;
import com.divya.bankingsystem.exception.AccountNotFoundException;
import com.divya.bankingsystem.repository.AccountRepository;
import com.divya.bankingsystem.repository.TransactionRepository;
import com.divya.bankingsystem.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository, AccountRepository accountRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    // Call this from AccountService when doing transactions
    public void recordTransaction(Long fromAccountId, Long toAccountId,
                                  Double amount, Transaction.TransactionType type,
                                  Transaction.TransactionCategory transactionCategory,
                                  String description) {

        Transaction transaction = new Transaction();

        if (fromAccountId != null) {
            Account fromAccount = accountRepository.findById(fromAccountId)
                    .orElseThrow(() -> new AccountNotFoundException(fromAccountId));
            transaction.setFromAccount(fromAccount);
        }

        if (toAccountId != null) {
            Account toAccount = accountRepository.findById(toAccountId)
                    .orElseThrow(() -> new AccountNotFoundException(toAccountId));
            transaction.setToAccount(toAccount);
        }

        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setCategory(transactionCategory);
        transaction.setDescription(description);
        transaction.setTimestamp(LocalDateTime.now());
        transactionRepository.save(transaction);
    }

    private TransactionResponse mapToResponse(Transaction transaction) {

        TransactionResponse response = new TransactionResponse();

        response.setTransactionId(transaction.getId());

        response.setFromAccountId(
                transaction.getFromAccount() != null ?
                        transaction.getFromAccount().getId() : null
        );

        response.setToAccountId(
                transaction.getToAccount() != null ?
                        transaction.getToAccount().getId() : null
        );

        response.setAmount(transaction.getAmount());
        response.setType(transaction.getType().name());
        response.setTimestamp(transaction.getTimestamp());

        return response;
    }

    public Page<TransactionResponse> getTransactions(Pageable pageable) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Long> accountIds = accountRepository
                .findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        Page<Transaction> transactions =
                transactionRepository.findByAccountIds(accountIds, pageable);

        return transactions.map(this::mapToResponse);
    }

    public Page<TransactionResponse> getTransactionsByAccountId(Long accountId, Pageable pageable) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new RuntimeException("Account not found for user"));

        Page<Transaction> transactions =
                transactionRepository.findAllByAccountId(accountId, pageable);

        return transactions.map(this::mapToResponse);
    }
}
