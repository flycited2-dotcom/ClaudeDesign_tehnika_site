package ru.partnercrm.domain.deal

import java.time.LocalDate

object DealDefaults {
    private const val DEFAULT_DELAY_DAYS = 14L

    fun defaultDueDate(dateIn: LocalDate): LocalDate = dateIn.plusDays(DEFAULT_DELAY_DAYS)
}
