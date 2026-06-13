package ru.partnercrm.domain.dashboard

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.domain.deal.DealDisplayStatus
import ru.partnercrm.domain.deal.DealLifecycleStatus

class DashboardCalculatorTest {
    private val today = LocalDate.of(2026, 6, 8)

    @Test
    fun `calculates active obligation totals and overdue summary`() {
        val summary = DashboardCalculator.calculate(
            deals = listOf(
                deal(
                    partnerId = 1,
                    partnerName = "Иван",
                    amountIn = 10_000.0,
                    amountToReturn = 9_000.0,
                    profit = 1_000.0,
                    dueDate = today.plusDays(5),
                ),
                deal(
                    partnerId = 2,
                    partnerName = "Мария",
                    amountIn = 5_000.0,
                    amountToReturn = 4_500.0,
                    profit = 500.0,
                    dueDate = today.minusDays(1),
                ),
                deal(
                    partnerId = 1,
                    partnerName = "Иван",
                    amountIn = 20_000.0,
                    amountToReturn = 18_000.0,
                    profit = 2_000.0,
                    dueDate = today.minusDays(10),
                    lifecycleStatus = DealLifecycleStatus.RETURNED,
                ),
            ),
            today = today,
        )

        assertEquals(15_000.0, summary.totalAmountIn)
        assertEquals(13_500.0, summary.totalAmountToReturn)
        assertEquals(1_500.0, summary.totalProfit)
        assertEquals(1_500.0, summary.expectedProfit)
        assertEquals(1, summary.overdueDealsCount)
        assertEquals(4_500.0, summary.overdueAmount)
        assertEquals(9_000.0, summary.dueThisWeekAmount)
        // Закрытая сделка 20 000 / 18 000 / профит 2 000 должна давать «Заработано».
        assertEquals(2_000.0, summary.realizedProfit)
        assertEquals(18_000.0, summary.realizedReturnedAmount)
        assertEquals(1, summary.closedDealsCount)
    }

    @Test
    fun `partner stays visible after all deals are closed and accrues realized profit`() {
        val summary = DashboardCalculator.calculate(
            deals = listOf(
                deal(
                    partnerId = 7,
                    partnerName = "Пётр",
                    amountIn = 100_000.0,
                    amountToReturn = 90_000.0,
                    profit = 10_000.0,
                    dueDate = today.minusDays(5),
                    lifecycleStatus = DealLifecycleStatus.RETURNED,
                ),
            ),
            today = today,
        )

        val partner = summary.partners.single()
        assertEquals(7, partner.partnerId)
        assertEquals(0, partner.activeDealsCount)
        assertEquals(0.0, partner.totalAmountIn)
        assertEquals(1, partner.closedDealsCount)
        assertEquals(10_000.0, partner.realizedProfit)
    }

    @Test
    fun `groups active deals by partner and keeps nearest due date`() {
        val summary = DashboardCalculator.calculate(
            deals = listOf(
                deal(
                    partnerId = 1,
                    partnerName = "Иван",
                    amountIn = 10_000.0,
                    amountToReturn = 9_000.0,
                    profit = 1_000.0,
                    dueDate = today.plusDays(5),
                ),
                deal(
                    partnerId = 1,
                    partnerName = "Иван",
                    amountIn = 30_000.0,
                    amountToReturn = 27_000.0,
                    profit = 3_000.0,
                    dueDate = today.plusDays(2),
                ),
            ),
            today = today,
        )

        val partner = summary.partners.single()
        assertEquals(1, partner.partnerId)
        assertEquals("Иван", partner.partnerName)
        assertEquals(40_000.0, partner.totalAmountIn)
        assertEquals(36_000.0, partner.totalAmountToReturn)
        assertEquals(4_000.0, partner.totalProfit)
        assertEquals(2, partner.activeDealsCount)
        assertEquals(today.plusDays(2), partner.nearestDueDate)
        assertEquals(DealDisplayStatus.DUE_SOON, partner.status)
    }

    private fun deal(
        partnerId: Long,
        partnerName: String,
        amountIn: Double,
        amountToReturn: Double,
        profit: Double,
        dueDate: LocalDate,
        lifecycleStatus: DealLifecycleStatus = DealLifecycleStatus.ACTIVE,
    ): DealDashboardItem {
        return DealDashboardItem(
            id = 1,
            partnerId = partnerId,
            partnerName = partnerName,
            amountIn = amountIn,
            amountToReturn = amountToReturn,
            profit = profit,
            dueDate = dueDate,
            lifecycleStatus = lifecycleStatus,
        )
    }
}
