package ru.partnercrm.share

import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale
import ru.partnercrm.data.model.Deal

object DealShareTextFormatter {
    private val MoneyFormat = DecimalFormat("#,##0", DecimalFormatSymbols(Locale.US))

    fun format(
        partnerName: String,
        deal: Deal,
        currencySymbol: String,
    ): String {
        return buildString {
            appendLine("Сделка: $partnerName")
            appendLine("Зашло: ${money(deal.amountIn, currencySymbol)}")
            appendLine("К возврату: ${money(deal.amountToReturn, currencySymbol)}")
            appendLine("Профит: ${money(deal.profit, currencySymbol)}")
            appendLine("Срок: ${deal.dueDate}")
            deal.comment?.takeIf { it.isNotBlank() }?.let { appendLine("Комментарий: $it") }
        }.trim()
    }

    private fun money(value: Double, currencySymbol: String): String {
        return "${MoneyFormat.format(value).replace(',', ' ')} $currencySymbol"
    }
}
