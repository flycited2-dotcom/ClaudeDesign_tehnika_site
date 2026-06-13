package ru.partnercrm.share

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertTrue
import ru.partnercrm.data.model.Deal
import ru.partnercrm.domain.deal.DealLifecycleStatus

class DealShareTextFormatterTest {
    @Test
    fun `formats deal summary for messenger sharing`() {
        val text = DealShareTextFormatter.format(
            partnerName = "Ivan",
            deal = Deal(
                id = 1,
                partnerId = 1,
                amountIn = 100_000.0,
                percent = 10.0,
                amountToReturn = 90_000.0,
                profit = 10_000.0,
                dateIn = LocalDate.of(2026, 6, 8),
                dueDate = LocalDate.of(2026, 6, 15),
                lifecycleStatus = DealLifecycleStatus.ACTIVE,
                comment = "first",
                createdAt = 1,
                updatedAt = 1,
            ),
            currencySymbol = "$",
        )

        assertTrue(text.contains("Ivan"))
        assertTrue(text.contains("100 000 $"))
        assertTrue(text.contains("90 000 $"))
        assertTrue(text.contains("2026-06-15"))
        assertTrue(text.contains("first"))
    }
}
