package ru.partnercrm.data.model

import java.time.LocalDate
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.deal.DealLifecycleStatus

data class Deal(
    val id: Long,
    val partnerId: Long,
    val amountIn: Double,
    val percent: Double,
    val amountToReturn: Double,
    val profit: Double,
    val paidOutAmount: Double = 0.0,
    val dateIn: LocalDate,
    val dueDate: LocalDate,
    val dateReturned: LocalDate? = null,
    val lifecycleStatus: DealLifecycleStatus,
    val comment: String? = null,
    val createdAt: Long,
    val updatedAt: Long,
)

fun Deal.remainingToReturn(): Double {
    if (lifecycleStatus != DealLifecycleStatus.ACTIVE) return 0.0
    return MoneyCalculator.roundMoney(maxOf(0.0, amountToReturn - paidOutAmount))
}

fun Deal.expectedProfit(): Double {
    return if (lifecycleStatus == DealLifecycleStatus.ACTIVE) profit else 0.0
}

fun Deal.realizedProfit(): Double {
    if (lifecycleStatus != DealLifecycleStatus.RETURNED) return 0.0
    return MoneyCalculator.roundMoney(amountIn - paidOutAmount)
}
