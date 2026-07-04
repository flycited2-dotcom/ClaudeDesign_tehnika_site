package ru.partnercrm.domain.deal

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class DealDefaultsTest {
    @Test
    fun `default due date is two weeks after incoming date`() {
        val dateIn = LocalDate.of(2026, 6, 10)

        assertEquals(LocalDate.of(2026, 6, 24), DealDefaults.defaultDueDate(dateIn))
    }
}
