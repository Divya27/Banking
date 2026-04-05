package com.divya.bankingsystem.service;

import com.divya.bankingsystem.dto.request.TransactionRequest;
import com.divya.bankingsystem.dto.request.WithdrawRequest;
import com.divya.bankingsystem.dto.response.AccountResponse;
import com.divya.bankingsystem.dto.request.CreateAccountRequest;
import com.divya.bankingsystem.dto.request.DepositRequest;
import com.divya.bankingsystem.dto.response.TransactionResponse;
import com.divya.bankingsystem.entity.Account;
import com.divya.bankingsystem.entity.Transaction;
import com.divya.bankingsystem.entity.User;
import com.divya.bankingsystem.exception.AccountNotFoundException;
import com.divya.bankingsystem.exception.InsufficientBalanceException;
import com.divya.bankingsystem.repository.AccountRepository;
import com.divya.bankingsystem.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountService {

    // repository
    private final AccountRepository accountRepository;

    private final TransactionService transactionService;

    private final UserRepository userRepository;

    // constructor
    public AccountService(AccountRepository accountRepository, TransactionService transactionService, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.transactionService = transactionService;
        this.userRepository = userRepository;
    }

    // helper method to check if account belongs to user
    private Account getUserAccount(Long accountId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AccountNotFoundException(accountId));
    }

    // account create
    public AccountResponse createAccount(CreateAccountRequest request) {

        // get logged-in user details
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Account newAccount = new Account();
        newAccount.setAccountHolderName(request.getAccountHolderName());
        newAccount.setBalance(request.getBalance());
        newAccount.setUser(user);
        newAccount.setAccountType(request.getAccountType());

        Account createdAccount = accountRepository.save(newAccount);

        AccountResponse response = new AccountResponse();
        response.setId(createdAccount.getId());
        response.setAccountHolderName(createdAccount.getAccountHolderName());
        response.setBalance(createdAccount.getBalance());
        return response;
    }

    // list accounts
    public List<Account> getAllAccounts() {
        // only return the accounts that user has access to
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return accountRepository.findByUserId(user.getId());
    }

    // get account by id
    public Account getAccountById(Long id) {
        return getUserAccount(id);
    }

    // deposit amount
    @Transactional
    public AccountResponse deposit(Long id, DepositRequest request) {

        // check for account existence
        Account account = getUserAccount(id);

        Double amount = request.getAmount();

        Double newBalance = account.getBalance() + amount;
        // updates in memory
        account.setBalance(newBalance);
        Account depositedAccount = accountRepository.save(account);

        AccountResponse depositResponse = new AccountResponse();
        depositResponse.setId(depositedAccount.getId());
        depositResponse.setAccountHolderName(depositedAccount.getAccountHolderName());
        depositResponse.setBalance(depositedAccount.getBalance());

        // record transaction
        transactionService.recordTransaction(null, id, amount, Transaction.TransactionType.DEPOSIT, request.getCategory(), request.getDescription());

        return depositResponse;

    }

    // withdraw amount
    @Transactional
    public AccountResponse withdraw(Long id, WithdrawRequest request) {
        // check for account existence
        Account account = getUserAccount(id);

        Double amount = request.getAmount();

        // check balance
        Double currentBalance = account.getBalance();
        if(currentBalance < amount) {
            throw new InsufficientBalanceException(currentBalance);
        }

        Double newBalance = currentBalance - amount;
        account.setBalance(newBalance);
        Account withdrawnAccount = accountRepository.save(account);

        AccountResponse withdrawalResponse = new AccountResponse();
        withdrawalResponse.setId(withdrawnAccount.getId());
        withdrawalResponse.setAccountHolderName(withdrawnAccount.getAccountHolderName());
        withdrawalResponse.setBalance(withdrawnAccount.getBalance());

        // record a transaction
        transactionService.recordTransaction(id, null, amount, Transaction.TransactionType.WITHDRAW, request.getCategory(), request.getDescription());

        return withdrawalResponse;
    }

    // transfer account
    @Transactional
    public TransactionResponse transfer(TransactionRequest request) {

        Account sourceAccount = getUserAccount(request.getFromAccountId());

        Account destinationAccount = accountRepository.findById(request.getToAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getToAccountId()));

        Double currentBalance = sourceAccount.getBalance();
        if(currentBalance < request.getAmount()) {
            throw new InsufficientBalanceException(currentBalance);
        }
        sourceAccount.setBalance(currentBalance - request.getAmount());
        destinationAccount.setBalance(destinationAccount.getBalance() + request.getAmount());

        // update in db
        accountRepository.save(sourceAccount);
        accountRepository.save(destinationAccount);

        TransactionResponse transactionResponse = new TransactionResponse();
        transactionResponse.setTransactionId(System.currentTimeMillis());
        transactionResponse.setFromAccountId(sourceAccount.getId());
        transactionResponse.setToAccountId(destinationAccount.getId());
        transactionResponse.setAmount(request.getAmount());
        transactionResponse.setType(Transaction.TransactionType.TRANSFER.name());
        transactionResponse.setCategory(request.getCategory());
        transactionResponse.setDescription(request.getDescription());
        transactionResponse.setStatus("SUCCESS");
        transactionResponse.setTimestamp(LocalDateTime.now());

        // save in transaction
        transactionService.recordTransaction(request.getFromAccountId(), request.getToAccountId(),
                request.getAmount(), Transaction.TransactionType.TRANSFER,
                request.getCategory(), request.getDescription());

        return transactionResponse;
    }

}
