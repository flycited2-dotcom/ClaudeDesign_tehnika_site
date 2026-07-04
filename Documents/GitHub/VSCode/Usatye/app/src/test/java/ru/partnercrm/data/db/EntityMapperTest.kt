package ru.partnercrm.data.db

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.deal.DealLifecycleStatus

class EntityMapperTest {
    @Test
    fun `maps partner model to entity and back`() {
        val partner = Partner(
            id = 7,
            name = "Ivan",
            phone = "+70000000000",
            telegram = "@ivan",
            comment = "VIP",
            defaultPercent = 10.0,
            createdAt = 100,
            updatedAt = 200,
            isActive = true,
        )

        val mapped = partner.toEntity().toModel()

        assertEquals(partner, mapped)
    }

    @Test
    fun `maps deal model to entity and back`() {
        val deal = Deal(
            id = 3,
            partnerId = 7,
            amountIn = 100_000.0,
            percent = 12.0,
            amountToReturn = 88_000.0,
            profit = 12_000.0,
            dateIn = LocalDate.of(2026, 6, 8),
            dueDate = LocalDate.of(2026, 6, 15),
            dateReturned = LocalDate.of(2026, 6, 14),
            lifecycleStatus = DealLifecycleStatus.RETURNED,
            comment = "Closed",
            createdAt = 100,
            updatedAt = 200,
        )

        val mapped = deal.toEntity().toModel()

        assertEquals(deal, mapped)
    }

    @Test
    fun `falls back to active lifecycle status for dirty database value`() {
        val entity = Deal(
            id = 3,
            partnerId = 7,
            amountIn = 100_000.0,
            percent = 12.0,
            amountToReturn = 88_000.0,
            profit = 12_000.0,
            dateIn = LocalDate.of(2026, 6, 8),
            dueDate = LocalDate.of(2026, 6, 15),
            lifecycleStatus = DealLifecycleStatus.RETURNED,
            createdAt = 100,
            updatedAt = 200,
        ).toEntity().copy(status = "BROKEN_STATUS")

        assertEquals(DealLifecycleStatus.ACTIVE, entity.toModel().lifecycleStatus)
    }
}
