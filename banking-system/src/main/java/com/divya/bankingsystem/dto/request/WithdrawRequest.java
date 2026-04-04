package com.divya.bankingsystem.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WithdrawRequest {

    @NotNull
    private Double amount;
}
