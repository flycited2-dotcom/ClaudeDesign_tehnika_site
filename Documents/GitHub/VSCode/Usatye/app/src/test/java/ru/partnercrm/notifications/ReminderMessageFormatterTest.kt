package ru.partnercrm.notifications

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class ReminderMessageFormatterTest {
    @Test
    fun `formats overdue reminder with partner amount and date`() {
        val message = ReminderMessageFormatter.format(
            type = ReminderType.OVERDUE,
            partnerName = "Ivan",
            amountToReturn = 90_000.0,
            dueDate = LocalDate.of(2026, 6, 8),
            currencySymbol = "$",
        )

        assertEquals("Просрочка по сделке", message.title)
        assertEquals("Ivan должен вернуть 90 000 $; срок был 2026-06-08", message.body)
    }
}
