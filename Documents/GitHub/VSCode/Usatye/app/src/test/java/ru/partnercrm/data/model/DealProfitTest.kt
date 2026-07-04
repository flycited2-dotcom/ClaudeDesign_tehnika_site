package ru.partnercrm.data.model

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.domain.deal.DealLifecycleStatus

class DealProfitTest {
    private val today = LocalDate.of(2026, 6, 8)

    @Test
    fun `active deal exposes expected profit and remaining return`() {
        val deal = deal(
            amountIn = 100_000.0,
            amountToReturn = 90_000.0,
            profit = 10_000.0,
            paidOutAmount = 30_000.0,
            lifecycleStatus = DealLifecycleStatus.ACTIVE,
        )

        assertEquals(10_000.0, deal.expectedProfit())
        assertEquals(0.0, deal.realizedProfit())
        assertEquals(60_000.0, deal.remainingToReturn())
    }

    @Test
    fun `returned deal exposes realized profit from actual payout`() {
        val deal = deal(
            amountIn = 100_000.0,
            amountToReturn = 90_000.0,
            profit = 10_000.0,
            paidOutAmount = 88_000.0,
            lifecycleStatus = DealLifecycleStatus.RETURNED,
        )

        assertEquals(0.0, deal.expectedProfit())
        assertEquals(12_000.0, deal.realizedProfit())
        assertEquals(0.0, deal.remainingToReturn())
    }

    private fun deal(
        amountIn: Double,
        amountToReturn: Double,
        profit: Double,
        paidOutAmount: Double,
        lifecycleStatus: DealLifecycleStatus,
    ): Deal {
        return Deal(
            id = 1,
            partnerId = 2,
            amountIn = amountIn,
            percent = 10.0,
            amountToReturn = amountToReturn,
            profit = profit,
            paidOutAmount = paidOutAmount,
            dateIn = today,
            dueDate = today.plusDays(7),
            dateReturned = if (lifecycleStatus == DealLifecycleStatus.RETURNED) today.plusDays(1) else null,
            lifecycleStatus = lifecycleStatus,
            createdAt = 1,
            updatedAt = 2,
        )
    }
}
