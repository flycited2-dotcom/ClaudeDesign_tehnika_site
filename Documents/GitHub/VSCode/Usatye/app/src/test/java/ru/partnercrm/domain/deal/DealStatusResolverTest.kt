package ru.partnercrm.domain.deal

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class DealStatusResolverTest {
    private val today = LocalDate.of(2026, 6, 8)

    @Test
    fun `keeps active deal active when due date is more than three days away`() {
        val status = DealStatusResolver.resolve(
            storedStatus = DealLifecycleStatus.ACTIVE,
            dueDate = today.plusDays(4),
            today = today,
        )

        assertEquals(DealDisplayStatus.ACTIVE, status)
    }

    @Test
    fun `marks active deal due soon when due date is within three days`() {
        val status = DealStatusResolver.resolve(
            storedStatus = DealLifecycleStatus.ACTIVE,
            dueDate = today.plusDays(3),
            today = today,
        )

        assertEquals(DealDisplayStatus.DUE_SOON, status)
    }

    @Test
    fun `marks active deal overdue when due date is before today`() {
        val status = DealStatusResolver.resolve(
            storedStatus = DealLifecycleStatus.ACTIVE,
            dueDate = today.minusDays(1),
            today = today,
        )

        assertEquals(DealDisplayStatus.OVERDUE, status)
    }

    @Test
    fun `keeps returned deal returned regardless of due date`() {
        val status = DealStatusResolver.resolve(
            storedStatus = DealLifecycleStatus.RETURNED,
            dueDate = today.minusDays(10),
            today = today,
        )

        assertEquals(DealDisplayStatus.RETURNED, status)
    }

    @Test
    fun `keeps cancelled deal cancelled regardless of due date`() {
        val status = DealStatusResolver.resolve(
            storedStatus = DealLifecycleStatus.CANCELLED,
            dueDate = today.minusDays(10),
            today = today,
        )

        assertEquals(DealDisplayStatus.CANCELLED, status)
    }
}
