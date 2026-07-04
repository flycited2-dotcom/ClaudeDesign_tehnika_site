package ru.partnercrm.domain.payment

import ru.partnercrm.data.model.Deal
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.deal.DealLifecycleStatus

data class PaymentAllocationPreviewRow(
    val deal: Deal,
    val appliedAmount: Double,
    val remainingAfter: Double,
    val willClose: Boolean,
)

object PaymentAllocationPreview {
    fun preview(deals: List<Deal>, payoutAmount: Double): List<PaymentAllocationPreviewRow> {
        var remainingPayout = MoneyCalculator.roundMoney(payoutAmount)
        if (remainingPayout <= 0.0) return emptyList()

        return deals
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .sortedWith(compareBy<Deal> { it.dateIn }.thenBy { it.id })
            .mapNotNull { deal ->
                if (remainingPayout <= 0.0) {
                    null
                } else {
                    val remainingBefore = PaymentAllocator.remainingToPay(deal)
                    val applied = minOf(remainingPayout, remainingBefore)
                    if (applied <= 0.0) {
                        null
                    } else {
                        remainingPayout = MoneyCalculator.roundMoney(remainingPayout - applied)
                        val remainingAfter = MoneyCalculator.roundMoney(remainingBefore - applied)
                        PaymentAllocationPreviewRow(
                            deal = deal,
                            appliedAmount = applied,
                            remainingAfter = remainingAfter,
                            willClose = remainingAfter <= 0.0,
                        )
                    }
                }
            }
    }
}
