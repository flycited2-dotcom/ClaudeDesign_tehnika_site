package ru.partnercrm.domain.payment

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.data.model.Deal
import ru.partnercrm.domain.deal.DealLifecycleStatus

class PaymentAllocatorTest {
    private val today = LocalDate.of(2026, 6, 18)

    @Test
    fun `allocates payout across oldest active partner deals and leaves partial deal active`() {
        val deals = listOf(
            deal(id = 1, amountToReturn = 120_000.0, dateIn = today.minusDays(3)),
            deal(id = 2, amountToReturn = 380_000.0, dateIn = today.minusDays(2)),
            deal(id = 3, amountToReturn = 1_000_000.0, dateIn = today.minusDays(1)),
        )

        val updated = PaymentAllocator.allocate(
            deals = deals,
            payoutAmount = 600_000.0,
            paidAt = today,
        )

        assertEquals(120_000.0, updated.single { it.id == 1L }.paidOutAmount)
        assertEquals(DealLifecycleStatus.RETURNED, updated.single { it.id == 1L }.lifecycleStatus)
        assertEquals(today, updated.single { it.id == 1L }.dateReturned)

        assertEquals(380_000.0, updated.single { it.id == 2L }.paidOutAmount)
        assertEquals(DealLifecycleStatus.RETURNED, updated.single { it.id == 2L }.lifecycleStatus)
        assertEquals(today, updated.single { it.id == 2L }.dateReturned)

        assertEquals(100_000.0, updated.single { it.id == 3L }.paidOutAmount)
        assertEquals(DealLifecycleStatus.ACTIVE, updated.single { it.id == 3L }.lifecycleStatus)
        assertEquals(null, updated.single { it.id == 3L }.dateReturned)
    }

    @Test
    fun `continues from existing partial payout before closing a deal`() {
        val deals = listOf(
            deal(id = 1, amountToReturn = 120_000.0, dateIn = today.minusDays(3), paidOutAmount = 120_000.0)
                .copy(lifecycleStatus = DealLifecycleStatus.RETURNED, dateReturned = today.minusDays(1)),
            deal(id = 2, amountToReturn = 380_000.0, dateIn = today.minusDays(2), paidOutAmount = 100_000.0),
            deal(id = 3, amountToReturn = 1_000_000.0, dateIn = today.minusDays(1)),
        )

        val updated = PaymentAllocator.allocate(
            deals = deals,
            payoutAmount = 300_000.0,
            paidAt = today,
        )

        assertEquals(380_000.0, updated.single { it.id == 2L }.paidOutAmount)
        assertEquals(DealLifecycleStatus.RETURNED, updated.single { it.id == 2L }.lifecycleStatus)
        assertEquals(20_000.0, updated.single { it.id == 3L }.paidOutAmount)
        assertEquals(DealLifecycleStatus.ACTIVE, updated.single { it.id == 3L }.lifecycleStatus)
    }

    @Test
    fun `allocates by incoming date even when creation order is reversed`() {
        val newerCreatedFirst = deal(
            id = 1,
            amountToReturn = 300_000.0,
            dateIn = today.minusDays(1),
        ).copy(createdAt = 1, updatedAt = 1)
        val olderCreatedLater = deal(
            id = 2,
            amountToReturn = 200_000.0,
            dateIn = today.minusDays(10),
        ).copy(createdAt = 99, updatedAt = 99)

        val updated = PaymentAllocator.allocate(
            deals = listOf(newerCreatedFirst, olderCreatedLater),
            payoutAmount = 200_000.0,
            paidAt = today,
        )

        assertEquals(DealLifecycleStatus.RETURNED, updated.single { it.id == 2L }.lifecycleStatus)
        assertEquals(200_000.0, updated.single { it.id == 2L }.paidOutAmount)
        assertEquals(DealLifecycleStatus.ACTIVE, updated.single { it.id == 1L }.lifecycleStatus)
        assertEquals(0.0, updated.single { it.id == 1L }.paidOutAmount)
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
        dueDate = dateIn.plusDays(7),
        lifecycleStatus = DealLifecycleStatus.ACTIVE,
        createdAt = id,
        updatedAt = id,
    )
}
