package ru.partnercrm.domain.deal

import java.time.LocalDate
import ru.partnercrm.data.model.Deal

enum class DealListFilter {
    ACTIVE,
    OVERDUE,
    DUE_SOON,
    HISTORY,
    ALL,
}

fun DealListFilter.applyTo(deals: List<Deal>, today: LocalDate): List<Deal> {
    return when (this) {
        DealListFilter.ACTIVE -> deals.filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
        DealListFilter.OVERDUE -> deals.filter {
            DealStatusResolver.resolve(it.lifecycleStatus, it.dueDate, today) == DealDisplayStatus.OVERDUE
        }

        DealListFilter.DUE_SOON -> deals.filter {
            DealStatusResolver.resolve(it.lifecycleStatus, it.dueDate, today) == DealDisplayStatus.DUE_SOON
        }

        DealListFilter.HISTORY -> deals.filter {
            it.lifecycleStatus == DealLifecycleStatus.RETURNED || it.lifecycleStatus == DealLifecycleStatus.CANCELLED
        }

        DealListFilter.ALL -> deals
    }.sortedWith(compareBy<Deal> { it.dueDate }.thenBy { it.id })
}
