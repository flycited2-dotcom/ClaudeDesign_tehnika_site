package ru.partnercrm.domain.dashboard

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.deal.DealLifecycleStatus

class DashboardBreakdownCalculatorTest {
    private val today = LocalDate.of(2026, 6, 21)

    @Test
    fun `groups every dashboard financial metric by partner`() {
        val first = partner(1, "Иван")
        val second = partner(2, "Мария")
        val deals = listOf(
            deal(
                id = 1,
                partnerId = first.id,
                amountIn = 100_000.0,
                amountToReturn = 90_000.0,
                paidOutAmount = 90_000.0,
                profit = 10_000.0,
                dueDate = today.minusDays(10),
                lifecycleStatus = DealLifecycleStatus.RETURNED,
            ),
            deal(
                id = 2,
                partnerId = first.id,
                amountIn = 200_000.0,
                amountToReturn = 180_000.0,
                paidOutAmount = 50_000.0,
                profit = 20_000.0,
                dueDate = today.minusDays(1),
            ),
            deal(
                id = 3,
                partnerId = second.id,
                amountIn = 300_000.0,
                amountToReturn = 270_000.0,
                profit = 30_000.0,
                dueDate = today.plusDays(3),
            ),
            deal(
                id = 4,
                partnerId = second.id,
                amountIn = 400_000.0,
                amountToReturn = 360_000.0,
                profit = 40_000.0,
                dueDate = today.minusDays(2),
                lifecycleStatus = DealLifecycleStatus.CANCELLED,
            ),
        )

        val toReturn = DashboardBreakdownCalculator.calculate(
            DashboardBreakdownType.TO_RETURN,
            partners = listOf(first, second),
            deals = deals,
            today = today,
        )
        val paidOut = DashboardBreakdownCalculator.calculate(
            DashboardBreakdownType.PAID_OUT,
            partners = listOf(first, second),
            deals = deals,
            today = today,
        )
        val overdue = DashboardBreakdownCalculator.calculate(
            DashboardBreakdownType.OVERDUE,
            partners = listOf(first, second),
            deals = deals,
            today = today,
        )
        val expected = DashboardBreakdownCalculator.calculate(
            DashboardBreakdownType.EXPECTED,
            partners = listOf(first, second),
            deals = deals,
            today = today,
        )
        val earned = DashboardBreakdownCalculator.calculate(
            DashboardBreakdownType.EARNED,
            partners = listOf(first, second),
            deals = deals,
            today = today,
        )

        assertEquals(400_000.0, toReturn.totalAmount)
        assertEquals(listOf("Иван", "Мария"), toReturn.lines.map { it.partnerName })
        assertEquals(listOf(130_000.0, 270_000.0), toReturn.lines.map { it.amount })
        assertEquals(140_000.0, paidOut.totalAmount)
        assertEquals(listOf("Иван"), paidOut.lines.map { it.partnerName })
        assertEquals(130_000.0, overdue.totalAmount)
        assertEquals(listOf("Иван"), overdue.lines.map { it.partnerName })
        assertEquals(50_000.0, expected.totalAmount)
        assertEquals(10_000.0, earned.totalAmount)
    }

    private fun partner(id: Long, name: String) = Partner(
        id = id,
        name = name,
        defaultPercent = 10.0,
        createdAt = id,
        updatedAt = id,
    )

    private fun deal(
        id: Long,
        partnerId: Long,
        amountIn: Double,
        amountToReturn: Double,
        paidOutAmount: Double = 0.0,
        profit: Double,
        dueDate: LocalDate,
        lifecycleStatus: DealLifecycleStatus = DealLifecycleStatus.ACTIVE,
    ) = Deal(
        id = id,
        partnerId = partnerId,
        amountIn = amountIn,
        percent = 10.0,
        amountToReturn = amountToReturn,
        profit = profit,
        paidOutAmount = paidOutAmount,
        dateIn = dueDate.minusDays(14),
        dueDate = dueDate,
        lifecycleStatus = lifecycleStatus,
        createdAt = id,
        updatedAt = id,
    )
}
