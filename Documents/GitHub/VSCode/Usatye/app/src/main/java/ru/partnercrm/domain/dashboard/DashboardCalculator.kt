package ru.partnercrm.domain.dashboard

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import ru.partnercrm.domain.deal.DealDisplayStatus
import ru.partnercrm.domain.deal.DealLifecycleStatus
import ru.partnercrm.domain.deal.DealStatusResolver

data class DealDashboardItem(
    val id: Long,
    val partnerId: Long,
    val partnerName: String,
    val amountIn: Double,
    val amountToReturn: Double,
    val profit: Double,
    val dueDate: LocalDate,
    val lifecycleStatus: DealLifecycleStatus,
)

data class PartnerDashboardSummary(
    val partnerId: Long,
    val partnerName: String,
    val totalAmountIn: Double,
    val totalAmountToReturn: Double,
    val totalProfit: Double,
    val activeDealsCount: Int,
    val nearestDueDate: LocalDate?,
    val status: DealDisplayStatus,
    val realizedProfit: Double = 0.0,
    val closedDealsCount: Int = 0,
)

data class DashboardSummary(
    val totalAmountIn: Double,
    val totalAmountToReturn: Double,
    val totalProfit: Double,
    val overdueDealsCount: Int,
    val overdueAmount: Double,
    val dueThisWeekAmount: Double,
    val partners: List<PartnerDashboardSummary>,
    val realizedProfit: Double = 0.0,
    val realizedReturnedAmount: Double = 0.0,
    val closedDealsCount: Int = 0,
) {
    /** Ожидаемый профит по ещё открытым сделкам (псевдоним totalProfit для ясности UI). */
    val expectedProfit: Double get() = totalProfit
}

object DashboardCalculator {
    fun calculate(deals: List<DealDashboardItem>, today: LocalDate): DashboardSummary {
        val activeDeals = deals.filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
        val closedDeals = deals.filter { it.lifecycleStatus == DealLifecycleStatus.RETURNED }
        val weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY))
        val displayStatuses = activeDeals.associateWith { deal ->
            DealStatusResolver.resolve(
                storedStatus = deal.lifecycleStatus,
                dueDate = deal.dueDate,
                today = today,
            )
        }
        val overdueDeals = displayStatuses
            .filterValues { it == DealDisplayStatus.OVERDUE }
            .keys

        return DashboardSummary(
            totalAmountIn = activeDeals.sumOf { it.amountIn },
            totalAmountToReturn = activeDeals.sumOf { it.amountToReturn },
            totalProfit = activeDeals.sumOf { it.profit },
            overdueDealsCount = overdueDeals.size,
            overdueAmount = overdueDeals.sumOf { it.amountToReturn },
            dueThisWeekAmount = activeDeals
                .filter { !it.dueDate.isBefore(today) && !it.dueDate.isAfter(weekEnd) }
                .sumOf { it.amountToReturn },
            partners = buildPartnerSummaries(activeDeals, closedDeals, displayStatuses),
            realizedProfit = closedDeals.sumOf { it.profit },
            realizedReturnedAmount = closedDeals.sumOf { it.amountToReturn },
            closedDealsCount = closedDeals.size,
        )
    }

    private fun buildPartnerSummaries(
        activeDeals: List<DealDashboardItem>,
        closedDeals: List<DealDashboardItem>,
        displayStatuses: Map<DealDashboardItem, DealDisplayStatus>,
    ): List<PartnerDashboardSummary> {
        val activeByPartner = activeDeals.groupBy { it.partnerId }
        val closedByPartner = closedDeals.groupBy { it.partnerId }
        val partnerIds = (activeByPartner.keys + closedByPartner.keys)

        return partnerIds
            .map { partnerId ->
                val partnerActive = activeByPartner[partnerId].orEmpty()
                val partnerClosed = closedByPartner[partnerId].orEmpty()
                val anyDeal = (partnerActive + partnerClosed).first()
                PartnerDashboardSummary(
                    partnerId = partnerId,
                    partnerName = anyDeal.partnerName,
                    totalAmountIn = partnerActive.sumOf { it.amountIn },
                    totalAmountToReturn = partnerActive.sumOf { it.amountToReturn },
                    totalProfit = partnerActive.sumOf { it.profit },
                    activeDealsCount = partnerActive.size,
                    nearestDueDate = partnerActive.minOfOrNull { it.dueDate },
                    status = worstStatus(partnerActive.mapNotNull { displayStatuses[it] }),
                    realizedProfit = partnerClosed.sumOf { it.profit },
                    closedDealsCount = partnerClosed.size,
                )
            }
            .sortedBy { it.nearestDueDate ?: LocalDate.MAX }
    }

    private fun worstStatus(statuses: List<DealDisplayStatus>): DealDisplayStatus {
        return when {
            DealDisplayStatus.OVERDUE in statuses -> DealDisplayStatus.OVERDUE
            DealDisplayStatus.DUE_SOON in statuses -> DealDisplayStatus.DUE_SOON
            else -> DealDisplayStatus.ACTIVE
        }
    }
}
