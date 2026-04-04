package com.divya.bankingsystem.exception;

public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(Double balance) {
        super("Insufficient balance. Current balance: " + balance);
    }
}
