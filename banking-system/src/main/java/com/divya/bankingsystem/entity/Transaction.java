package com.divya.bankingsystem.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name="transactions")
@Data
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "from_account_id")
    private Account fromAccount;

    @ManyToOne
    @JoinColumn(name = "to_account_id")
    private Account toAccount;

    private Double amount;

    public enum TransactionType {
        DEPOSIT, WITHDRAW, TRANSFER
    }

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    // TransactionCategory.java
    public enum TransactionCategory {
        FOOD,
        SHOPPING,
        TRAVEL,
        ENTERTAINMENT,
        UTILITIES,
        HEALTHCARE,
        EDUCATION,
        TRANSFER,
        OTHER
    }

    @Column
    @Enumerated(EnumType.STRING)
    private TransactionCategory category;

    @Column
    private String description;

    private LocalDateTime timestamp;
}
