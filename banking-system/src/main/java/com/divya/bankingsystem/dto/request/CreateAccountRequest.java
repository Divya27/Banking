package com.divya.bankingsystem.dto.request;

import com.divya.bankingsystem.entity.Account;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAccountRequest {

    @NotNull
    private String accountHolderName;

    @NotNull
    private Double balance;

    @NotNull
    private Account.AccountType accountType;
}