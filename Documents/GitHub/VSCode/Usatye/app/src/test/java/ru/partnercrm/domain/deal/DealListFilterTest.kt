package ru.partnercrm.domain.deal

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.data.model.Deal

class DealListFilterTest {
    private val today = LocalDate.of(2026, 6, 8)

    @Test
    fun `history filter returns closed and cancelled deals`() {
        val deals = listOf(
            deal(id = 1, status = DealLifecycleStatus.ACTIVE),
            deal(id = 2, status = DealLifecycleStatus.RETURNED),
            deal(id = 3, status = DealLifecycleStatus.CANCELLED),
        )

        val filtered = DealListFilter.HISTORY.applyTo(deals, today)

        assertEquals(listOf(2L, 3L), filtered.map { it.id })
    }

    @Test
    fun `overdue filter returns active deals past due date`() {
        val deals = listOf(
            deal(id = 1, dueDate = today.minusDays(1)),
            deal(id = 2, dueDate = today.plusDays(1)),
            deal(id = 3, dueDate = today.minusDays(1), status = DealLifecycleStatus.RETURNED),
        )

        val filtered = DealListFilter.OVERDUE.applyTo(deals, today)

        assertEquals(listOf(1L), filtered.map { it.id })
    }

    @Test
    fun `active deals list follows incoming date rather than due date`() {
        val deals = listOf(
            deal(
                id = 1,
                dateIn = today.minusDays(1),
                dueDate = today.plusDays(1),
            ),
            deal(
                id = 2,
                dateIn = today.minusDays(10),
                dueDate = today.plusDays(30),
            ),
        )

        val filtered = DealListFilter.ACTIVE.applyTo(deals, today)

        assertEquals(listOf(2L, 1L), filtered.map { it.id })
    }

    @Test
    fun `partner timeline keeps earlier closed deal before newer active deal`() {
        val deals = listOf(
            deal(
                id = 1,
                dateIn = today.minusDays(1),
                status = DealLifecycleStatus.ACTIVE,
            ),
            deal(
                id = 2,
                dateIn = today.minusDays(10),
                status = DealLifecycleStatus.RETURNED,
            ),
        )

        assertEquals(listOf(2L, 1L), deals.sortedForIncomingTimeline().map { it.id })
    }

    private fun deal(
        id: Long,
        dateIn: LocalDate = today,
        dueDate: LocalDate = today.plusDays(7),
        status: DealLifecycleStatus = DealLifecycleStatus.ACTIVE,
    ): Deal {
        return Deal(
            id = id,
            partnerId = 1,
            amountIn = 100_000.0,
            percent = 10.0,
            amountToReturn = 90_000.0,
            profit = 10_000.0,
            dateIn = dateIn,
            dueDate = dueDate,
            lifecycleStatus = status,
            createdAt = 1,
            updatedAt = 1,
        )
    }
}
