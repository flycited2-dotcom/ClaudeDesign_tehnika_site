package ru.partnercrm.domain.report

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.deal.DealLifecycleStatus

class PeriodReportCalculatorTest {
    private val partners = listOf(
        partner(1, "Иван"),
        partner(2, "Мария"),
    )

    @Test
    fun `aggregates incoming by dateIn and realized profit by dateReturned within range`() {
        val deals = listOf(
            // Открыта и закрыта в июне → зашло + заработано.
            deal(id = 1, partnerId = 1, amountIn = 100_000.0, amountToReturn = 90_000.0, profit = 10_000.0,
                dateIn = LocalDate.of(2026, 6, 3), status = DealLifecycleStatus.RETURNED, dateReturned = LocalDate.of(2026, 6, 20)),
            // Открыта в июне, ещё активна → зашло + ожидаемый профит, не реализованный.
            deal(id = 2, partnerId = 2, amountIn = 50_000.0, amountToReturn = 45_000.0, profit = 5_000.0,
                dateIn = LocalDate.of(2026, 6, 10), status = DealLifecycleStatus.ACTIVE),
            // Открыта в мае → вне периода по дате поступления.
            deal(id = 3, partnerId = 1, amountIn = 999_000.0, amountToReturn = 900_000.0, profit = 99_000.0,
                dateIn = LocalDate.of(2026, 5, 30), status = DealLifecycleStatus.ACTIVE),
        )

        val report = PeriodReportCalculator.calculate(
            partners = partners,
            deals = deals,
            start = LocalDate.of(2026, 6, 1),
            end = LocalDate.of(2026, 6, 30),
        )

        assertEquals(150_000.0, report.amountIn)
        assertEquals(90_000.0, report.returnedAmount)
        assertEquals(10_000.0, report.realizedProfit)
        assertEquals(5_000.0, report.expectedProfit)
        assertEquals(45_000.0, report.outstandingToReturn)
        assertEquals(2, report.dealsOpened)
        assertEquals(1, report.dealsClosed)
    }

    @Test
    fun `month period boundaries are computed from anchor`() {
        val selection = PeriodSelection(ReportPeriodType.MONTH, LocalDate.of(2026, 6, 13))
        assertEquals(LocalDate.of(2026, 6, 1), selection.start)
        assertEquals(LocalDate.of(2026, 6, 30), selection.end)
        assertEquals(LocalDate.of(2026, 5, 1), selection.previous().start)
        assertEquals(LocalDate.of(2026, 7, 31), selection.next().end)
    }

    @Test
    fun `quarter period covers three months`() {
        val selection = PeriodSelection(ReportPeriodType.QUARTER, LocalDate.of(2026, 6, 13))
        assertEquals(LocalDate.of(2026, 4, 1), selection.start)
        assertEquals(LocalDate.of(2026, 6, 30), selection.end)
        assertEquals("II квартал 2026", selection.label())
    }

    @Test
    fun `year period covers full year`() {
        val selection = PeriodSelection(ReportPeriodType.YEAR, LocalDate.of(2026, 6, 13))
        assertEquals(LocalDate.of(2026, 1, 1), selection.start)
        assertEquals(LocalDate.of(2026, 12, 31), selection.end)
        assertEquals("2026", selection.label())
    }

    private fun partner(id: Long, name: String) = Partner(
        id = id,
        name = name,
        defaultPercent = 10.0,
        createdAt = 1,
        updatedAt = 1,
    )

    private fun deal(
        id: Long,
        partnerId: Long,
        amountIn: Double,
        amountToReturn: Double,
        profit: Double,
        dateIn: LocalDate,
        status: DealLifecycleStatus,
        dateReturned: LocalDate? = null,
        paidOutAmount: Double = if (status == DealLifecycleStatus.RETURNED) amountToReturn else 0.0,
    ) = Deal(
        id = id,
        partnerId = partnerId,
        amountIn = amountIn,
        percent = 10.0,
        amountToReturn = amountToReturn,
        profit = profit,
        paidOutAmount = paidOutAmount,
        dateIn = dateIn,
        dueDate = dateIn.plusDays(7),
        dateReturned = dateReturned,
        lifecycleStatus = status,
        createdAt = 1,
        updatedAt = 1,
    )
}
