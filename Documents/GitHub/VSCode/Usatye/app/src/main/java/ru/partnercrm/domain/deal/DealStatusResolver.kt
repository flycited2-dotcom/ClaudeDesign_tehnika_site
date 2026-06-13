package ru.partnercrm.domain.deal

import java.time.LocalDate

enum class DealLifecycleStatus {
    ACTIVE,
    RETURNED,
    CANCELLED,
}

enum class DealDisplayStatus {
    ACTIVE,
    DUE_SOON,
    OVERDUE,
    RETURNED,
    CANCELLED,
}

object DealStatusResolver {
    fun resolve(
        storedStatus: DealLifecycleStatus,
        dueDate: LocalDate,
        today: LocalDate,
    ): DealDisplayStatus {
        return when {
            storedStatus == DealLifecycleStatus.RETURNED -> DealDisplayStatus.RETURNED
            storedStatus == DealLifecycleStatus.CANCELLED -> DealDisplayStatus.CANCELLED
            dueDate.isBefore(today) -> DealDisplayStatus.OVERDUE
            !dueDate.isAfter(today.plusDays(3)) -> DealDisplayStatus.DUE_SOON
            else -> DealDisplayStatus.ACTIVE
        }
    }
}
