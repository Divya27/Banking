package com.divya.bankingsystem.dto.response;

import com.divya.bankingsystem.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class AccountResponse {

    private Long id;
    private String accountHolderName;
    private Double balance;
    private Account.AccountType accountType;
}
