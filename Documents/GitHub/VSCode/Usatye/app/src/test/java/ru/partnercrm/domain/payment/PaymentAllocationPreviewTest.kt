package ru.partnercrm.domain.payment

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.data.model.Deal
import ru.partnercrm.domain.deal.DealLifecycleStatus

class PaymentAllocationPreviewTest {
    private val today = LocalDate.of(2026, 6, 19)

    @Test
    fun `previews payout allocation across oldest active deals`() {
        val first = deal(id = 1, amountToReturn = 300_000.0, dateIn = today.minusDays(3))
        val second = deal(id = 2, amountToReturn = 300_000.0, dateIn = today.minusDays(2))
        val third = deal(id = 3, amountToReturn = 300_000.0, dateIn = today.minusDays(1))

        val preview = PaymentAllocationPreview.preview(
            deals = listOf(third, second, first),
            payoutAmount = 500_000.0,
        )

        assertEquals(listOf(1L, 2L), preview.map { it.deal.id })
        assertEquals(300_000.0, preview[0].appliedAmount)
        assertEquals(0.0, preview[0].remainingAfter)
        assertEquals(true, preview[0].willClose)
        assertEquals(200_000.0, preview[1].appliedAmount)
        assertEquals(100_000.0, preview[1].remainingAfter)
        assertEquals(false, preview[1].willClose)
    }

    private fun deal(
        id: Long,
        amountToReturn: Double,
        dateIn: LocalDate,
        paidOutAmount: Double = 0.0,
    ) = Deal(
        id = id,
        partnerId = 1,
        amountIn = amountToReturn,
        percent = 0.0,
        amountToReturn = amountToReturn,
        profit = 0.0,
        paidOutAmount = paidOutAmount,
        dateIn = dateIn,
        dueDate = dateIn.plusDays(14),
        lifecycleStatus = DealLifecycleStatus.ACTIVE,
        createdAt = id,
        updatedAt = id,
    )
}
