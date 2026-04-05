package com.divya.bankingsystem.controller;

import com.divya.bankingsystem.entity.Account;
import com.divya.bankingsystem.entity.Transaction;
import com.divya.bankingsystem.repository.AccountRepository;
import com.divya.bankingsystem.repository.TransactionRepository;
import com.divya.bankingsystem.service.InsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightController {

  private final InsightService insightService;
  private final TransactionRepository transactionRepository;
  private final AccountRepository accountRepository;

  // ============================================================
  // GET /api/insights/{accountId}
  // Fetches last 30 days transactions → calls Claude → returns insights
  // Protected — JWT token required
  // ============================================================
  @GetMapping("/{accountId}")
  public ResponseEntity<?> getInsights(@PathVariable Long accountId) {

    try {
      // Get logged in user from Security context
      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      String email = auth.getName();

      // Get account holder name for personalised insights
      Account account = accountRepository.findById(accountId)
              .orElseThrow(() -> new RuntimeException("Account not found"));

      String holderName = account.getAccountHolderName();

      // Last 30 days date filter
      LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

      // Fetch last 30 days transactions for this account
      /**
       * find                    → SELECT * FROM transactions
       * By                      → WHERE
       * FromAccountId           → from_account_id = ?        ← first param: accountId
       * Or                      → OR
       * ToAccountId             → to_account_id = ?          ← second param: accountId
       * And                     → AND
       * Timestamp               → timestamp
       * After                   → > ?                        ← third param: thirtyDaysAgo
       * OrderBy                 → ORDER BY
       * Timestamp               → timestamp
       * Desc                    → DESC
       *
       * e.g.
       *
       * SELECT * FROM transactions
       * WHERE (from_account_id = 5 OR to_account_id = 5)
       * AND timestamp > '2026-03-05 00:00:00'
       * ORDER BY timestamp DESC
       */
      List<Transaction> transactions = transactionRepository
              .findByFromAccountIdOrToAccountIdAndTimestampAfterOrderByTimestampDesc(
                      accountId, accountId, thirtyDaysAgo
              );

      System.out.println(transactions);
      // No transactions in last 30 days, returns a JSON response
      // Map.of is used to create immutable maps, useful in returning small JSON responses without creating DTO classes
      if (transactions.isEmpty()) {
        return ResponseEntity.ok(Map.of(
                "insights", "No transactions found in the last 30 days.",
                "status",   "no_data"
        ));
      }

      // Filter to categorized transactions only
      // AI works best with categorized data
      List<Map<String, Object>> txData = transactions.stream()
              .filter(tx -> tx.getCategory() != null)
              .map(tx -> Map.<String, Object>of(
                      "type",        tx.getType().toString(),
                      "amount",      tx.getAmount(),
                      "category",    tx.getCategory().toString(),
                      "description", tx.getDescription() != null
                              ? tx.getDescription() : "",
                      "date",        tx.getTimestamp().toString()
              ))
              .collect(Collectors.toList());
      System.out.println(txData);
      // No categorized transactions
      if (txData.isEmpty()) {
        return ResponseEntity.ok(Map.of(
                "insights", "Add categories to your transactions to see AI spending insights.",
                "status",   "no_categories"
        ));
      }

      // Call Claude API via InsightService
      String insights = insightService.getSpendingInsights(holderName, txData);

      return ResponseEntity.ok(Map.of(
              "insights", insights,
              "status",   "success"
      ));

    } catch (RuntimeException e) {

      // Rate limit — free API tier exhausted
      if ("RATE_LIMIT".equals(e.getMessage())) {
        return ResponseEntity.ok(Map.of(
                "insights", null,
                "status",   "rate_limit"
        ));
      }

      // Other known API error
      if ("API_ERROR".equals(e.getMessage())) {
        return ResponseEntity.ok(Map.of(
                "insights", null,
                "status",   "error"
        ));
      }

      // Unknown error
      return ResponseEntity.ok(Map.of(
              "insights", null,
              "status",   "error"
      ));

    } catch (Exception e) {
      return ResponseEntity.ok(Map.of(
              "insights", null,
              "status",   "error"
      ));
    }
  }
}
