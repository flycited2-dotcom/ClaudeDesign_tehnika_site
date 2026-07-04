package ru.partnercrm.domain.payment

import java.time.LocalDate
import ru.partnercrm.data.model.Deal
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.deal.DealLifecycleStatus

object PaymentAllocator {
    fun allocate(
        deals: List<Deal>,
        payoutAmount: Double,
        paidAt: LocalDate,
    ): List<Deal> {
        var remainingPayout = MoneyCalculator.roundMoney(payoutAmount)
        if (remainingPayout <= 0.0) return deals

        val activeById = deals
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .sortedWith(compareBy<Deal> { it.dateIn }.thenBy { it.id })
            .associate { deal ->
                if (remainingPayout <= 0.0) {
                    deal.id to deal
                } else {
                    val remainingToPay = remainingToPay(deal)
                    val paymentForDeal = minOf(remainingPayout, remainingToPay)
                    remainingPayout = MoneyCalculator.roundMoney(remainingPayout - paymentForDeal)
                    val paidOut = MoneyCalculator.roundMoney(deal.paidOutAmount + paymentForDeal)
                    val isFullyPaid = paidOut >= deal.amountToReturn
                    deal.id to deal.copy(
                        paidOutAmount = paidOut,
                        profit = if (isFullyPaid) MoneyCalculator.roundMoney(deal.amountIn - paidOut) else deal.profit,
                        dateReturned = if (isFullyPaid) paidAt else deal.dateReturned,
                        lifecycleStatus = if (isFullyPaid) DealLifecycleStatus.RETURNED else DealLifecycleStatus.ACTIVE,
                    )
                }
            }

        return deals.map { deal -> activeById[deal.id] ?: deal }
    }

    fun remainingToPay(deal: Deal): Double {
        return MoneyCalculator.roundMoney(maxOf(0.0, deal.amountToReturn - deal.paidOutAmount))
    }
}
