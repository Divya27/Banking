package com.divya.bankingsystem.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class DepositRequest {

    @Positive
    private Double amount;

}
