package ru.partnercrm.notifications

import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.time.LocalDate
import java.util.Locale

data class ReminderMessage(
    val title: String,
    val body: String,
)

object ReminderMessageFormatter {
    private val MoneyFormat = DecimalFormat("#,##0.##", DecimalFormatSymbols(Locale.US))

    fun format(
        type: ReminderType,
        partnerName: String,
        amountToReturn: Double,
        dueDate: LocalDate,
        currencySymbol: String,
    ): ReminderMessage {
        val amount = "${MoneyFormat.format(amountToReturn).replace(',', ' ')} $currencySymbol"
        return when (type) {
            ReminderType.THREE_DAYS_BEFORE -> ReminderMessage(
                title = "Срок через 3 дня",
                body = "$partnerName должен вернуть $amount до $dueDate",
            )

            ReminderType.ONE_DAY_BEFORE -> ReminderMessage(
                title = "Срок завтра",
                body = "$partnerName должен вернуть $amount до $dueDate",
            )

            ReminderType.DUE_DATE -> ReminderMessage(
                title = "Срок возврата сегодня",
                body = "$partnerName должен вернуть $amount сегодня",
            )

            ReminderType.OVERDUE -> ReminderMessage(
                title = "Просрочка по сделке",
                body = "$partnerName должен вернуть $amount; срок был $dueDate",
            )
        }
    }
}
