package ru.partnercrm.data.model

import ru.partnercrm.domain.calculator.CalcType

data class AppSettings(
    val remindersEnabled: Boolean = true,
    val remindThreeDaysBefore: Boolean = true,
    val remindOneDayBefore: Boolean = true,
    val remindOnDueDate: Boolean = true,
    val remindOverdueDaily: Boolean = true,
    val currencySymbol: String = "₽",
    val notifyTime: String = "09:00",
    val hideAmounts: Boolean = false,
    val calcType: CalcType = CalcType.DISCOUNT,
)
