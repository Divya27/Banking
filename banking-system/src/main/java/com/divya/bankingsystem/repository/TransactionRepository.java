package com.divya.bankingsystem.repository;

import com.divya.bankingsystem.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("""
           SELECT t FROM Transaction t
           WHERE t.fromAccount.id = :accountId
           OR t.toAccount.id = :accountId
           """)
    Page<Transaction> findAllByAccountId(@Param("accountId") Long accountId, Pageable pageable);

    @Query("""
            SELECT t FROM Transaction t
            WHERE t.fromAccount.user.id = :userId
            OR t.toAccount.user.id = :userId
            ORDER BY t.timestamp DESC
            """)
    Page<Transaction> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
       SELECT t FROM Transaction t
       WHERE t.fromAccount.id IN :accountIds
       OR t.toAccount.id IN :accountIds
       ORDER BY t.timestamp DESC
       """)
    Page<Transaction> findByAccountIds(List<Long> accountIds, Pageable pageable);

    // spring JPA reads method name and automatically generates SQL query
    List<Transaction> findByFromAccountIdOrToAccountIdAndTimestampAfterOrderByTimestampDesc(
            Long fromAccountId,
            Long toAccountId,
            LocalDateTime after
    );
}
