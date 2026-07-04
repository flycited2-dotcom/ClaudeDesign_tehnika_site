package ru.partnercrm.domain.dashboard

import java.time.LocalDate
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.data.model.expectedProfit
import ru.partnercrm.data.model.realizedProfit
import ru.partnercrm.data.model.remainingToReturn
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.deal.DealDisplayStatus
import ru.partnercrm.domain.deal.DealLifecycleStatus
import ru.partnercrm.domain.deal.DealStatusResolver

enum class DashboardBreakdownType(val title: String) {
    EARNED("Заработано"),
    EXPECTED("Ожидается"),
    INCOMING("Всего зашло"),
    TO_RETURN("К возврату"),
    OVERDUE("Просрочено"),
    PAID_OUT("Выдано"),
}

data class DashboardBreakdownLine(
    val partnerId: Long,
    val partnerName: String,
    val amount: Double,
    val dealsCount: Int,
)

data class DashboardBreakdown(
    val type: DashboardBreakdownType,
    val totalAmount: Double,
    val lines: List<DashboardBreakdownLine>,
)

object DashboardBreakdownCalculator {
    fun calculate(
        type: DashboardBreakdownType,
        partners: List<Partner>,
        deals: List<Deal>,
        today: LocalDate,
    ): DashboardBreakdown {
        val partnersById = partners.associateBy { it.id }
        val matchingDeals = deals.filter { deal -> matches(type, deal, today) }
        val lines = matchingDeals
            .groupBy { it.partnerId }
            .mapNotNull { (partnerId, partnerDeals) ->
                val amount = MoneyCalculator.roundMoney(partnerDeals.sumOf { amountFor(type, it) })
                if (amount <= 0.0) {
                    null
                } else {
                    DashboardBreakdownLine(
                        partnerId = partnerId,
                        partnerName = partnersById[partnerId]?.name ?: "Партнёр #$partnerId",
                        amount = amount,
                        dealsCount = partnerDeals.size,
                    )
                }
            }
            .sortedBy { it.partnerName.lowercase() }

        return DashboardBreakdown(
            type = type,
            totalAmount = MoneyCalculator.roundMoney(lines.sumOf { it.amount }),
            lines = lines,
        )
    }

    private fun matches(type: DashboardBreakdownType, deal: Deal, today: LocalDate): Boolean {
        return when (type) {
            DashboardBreakdownType.EARNED -> deal.lifecycleStatus == DealLifecycleStatus.RETURNED
            DashboardBreakdownType.EXPECTED,
            DashboardBreakdownType.INCOMING,
            DashboardBreakdownType.TO_RETURN,
            -> deal.lifecycleStatus == DealLifecycleStatus.ACTIVE

            DashboardBreakdownType.OVERDUE -> {
                DealStatusResolver.resolve(deal.lifecycleStatus, deal.dueDate, today) == DealDisplayStatus.OVERDUE
            }

            DashboardBreakdownType.PAID_OUT -> {
                deal.lifecycleStatus != DealLifecycleStatus.CANCELLED && deal.paidOutAmount > 0.0
            }
        }
    }

    private fun amountFor(type: DashboardBreakdownType, deal: Deal): Double {
        return when (type) {
            DashboardBreakdownType.EARNED -> deal.realizedProfit()
            DashboardBreakdownType.EXPECTED -> deal.expectedProfit()
            DashboardBreakdownType.INCOMING -> deal.amountIn
            DashboardBreakdownType.TO_RETURN,
            DashboardBreakdownType.OVERDUE,
            -> deal.remainingToReturn()

            DashboardBreakdownType.PAID_OUT -> deal.paidOutAmount
        }
    }
}
