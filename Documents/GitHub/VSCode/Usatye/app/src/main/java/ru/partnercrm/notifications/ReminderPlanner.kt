package ru.partnercrm.notifications

import java.time.LocalDate
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.domain.deal.DealLifecycleStatus

enum class ReminderType {
    THREE_DAYS_BEFORE,
    ONE_DAY_BEFORE,
    DUE_DATE,
    OVERDUE,
}

data class ReminderPlan(
    val dealId: Long,
    val type: ReminderType,
    val triggerDate: LocalDate,
)

object ReminderPlanner {
    fun plan(
        deals: List<Deal>,
        today: LocalDate,
        settings: AppSettings,
    ): List<ReminderPlan> {
        if (!settings.remindersEnabled) return emptyList()

        return deals
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .flatMap { deal ->
                buildList {
                    if (settings.remindThreeDaysBefore && deal.dueDate.minusDays(3) == today) {
                        add(ReminderPlan(deal.id, ReminderType.THREE_DAYS_BEFORE, today))
                    }
                    if (settings.remindOneDayBefore && deal.dueDate.minusDays(1) == today) {
                        add(ReminderPlan(deal.id, ReminderType.ONE_DAY_BEFORE, today))
                    }
                    if (settings.remindOnDueDate && deal.dueDate == today) {
                        add(ReminderPlan(deal.id, ReminderType.DUE_DATE, today))
                    }
                    if (settings.remindOverdueDaily && deal.dueDate.isBefore(today)) {
                        add(ReminderPlan(deal.id, ReminderType.OVERDUE, today))
                    }
                }
            }
            .sortedWith(compareBy<ReminderPlan> { it.dealId }.thenBy { it.type.ordinal })
    }

    fun upcoming(
        deals: List<Deal>,
        today: LocalDate,
        settings: AppSettings,
    ): List<ReminderPlan> {
        if (!settings.remindersEnabled) return emptyList()

        return deals
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .flatMap { deal ->
                buildList {
                    addFuturePlan(
                        enabled = settings.remindThreeDaysBefore,
                        dealId = deal.id,
                        type = ReminderType.THREE_DAYS_BEFORE,
                        triggerDate = deal.dueDate.minusDays(3),
                        today = today,
                    )
                    addFuturePlan(
                        enabled = settings.remindOneDayBefore,
                        dealId = deal.id,
                        type = ReminderType.ONE_DAY_BEFORE,
                        triggerDate = deal.dueDate.minusDays(1),
                        today = today,
                    )
                    addFuturePlan(
                        enabled = settings.remindOnDueDate,
                        dealId = deal.id,
                        type = ReminderType.DUE_DATE,
                        triggerDate = deal.dueDate,
                        today = today,
                    )
                    if (settings.remindOverdueDaily && deal.dueDate.isBefore(today)) {
                        add(ReminderPlan(deal.id, ReminderType.OVERDUE, today))
                    }
                }
            }
            .sortedWith(compareBy<ReminderPlan> { it.triggerDate }.thenBy { it.dealId }.thenBy { it.type.ordinal })
    }

    private fun MutableList<ReminderPlan>.addFuturePlan(
        enabled: Boolean,
        dealId: Long,
        type: ReminderType,
        triggerDate: LocalDate,
        today: LocalDate,
    ) {
        if (enabled && !triggerDate.isBefore(today)) {
            add(ReminderPlan(dealId, type, triggerDate))
        }
    }
}
