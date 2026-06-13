package ru.partnercrm.notifications

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.domain.deal.DealLifecycleStatus

class ReminderPlannerTest {
    private val today = LocalDate.of(2026, 6, 8)

    @Test
    fun `plans reminders three days one day due date and overdue only for active deals`() {
        val plans = ReminderPlanner.plan(
            deals = listOf(
                deal(id = 1, dueDate = today.plusDays(3)),
                deal(id = 2, dueDate = today.plusDays(1)),
                deal(id = 3, dueDate = today),
                deal(id = 4, dueDate = today.minusDays(2)),
                deal(id = 5, dueDate = today.plusDays(3), lifecycleStatus = DealLifecycleStatus.RETURNED),
            ),
            today = today,
            settings = AppSettings(),
        )

        assertEquals(
            listOf(
                ReminderPlan(dealId = 1, type = ReminderType.THREE_DAYS_BEFORE, triggerDate = today),
                ReminderPlan(dealId = 2, type = ReminderType.ONE_DAY_BEFORE, triggerDate = today),
                ReminderPlan(dealId = 3, type = ReminderType.DUE_DATE, triggerDate = today),
                ReminderPlan(dealId = 4, type = ReminderType.OVERDUE, triggerDate = today),
            ),
            plans,
        )
    }

    @Test
    fun `does not plan disabled reminder types`() {
        val plans = ReminderPlanner.plan(
            deals = listOf(
                deal(id = 1, dueDate = today.plusDays(3)),
                deal(id = 2, dueDate = today.minusDays(1)),
            ),
            today = today,
            settings = AppSettings(
                remindThreeDaysBefore = false,
                remindOverdueDaily = false,
            ),
        )

        assertEquals(emptyList(), plans)
    }

    @Test
    fun `plans upcoming reminders from today forward`() {
        val plans = ReminderPlanner.upcoming(
            deals = listOf(
                deal(id = 1, dueDate = today.plusDays(5)),
                deal(id = 2, dueDate = today.minusDays(1)),
            ),
            today = today,
            settings = AppSettings(),
        )

        assertEquals(
            listOf(
                ReminderPlan(dealId = 2, type = ReminderType.OVERDUE, triggerDate = today),
                ReminderPlan(dealId = 1, type = ReminderType.THREE_DAYS_BEFORE, triggerDate = today.plusDays(2)),
                ReminderPlan(dealId = 1, type = ReminderType.ONE_DAY_BEFORE, triggerDate = today.plusDays(4)),
                ReminderPlan(dealId = 1, type = ReminderType.DUE_DATE, triggerDate = today.plusDays(5)),
            ),
            plans,
        )
    }

    private fun deal(
        id: Long,
        dueDate: LocalDate,
        lifecycleStatus: DealLifecycleStatus = DealLifecycleStatus.ACTIVE,
    ): Deal {
        return Deal(
            id = id,
            partnerId = 1,
            amountIn = 100_000.0,
            percent = 10.0,
            amountToReturn = 90_000.0,
            profit = 10_000.0,
            dateIn = today.minusDays(7),
            dueDate = dueDate,
            lifecycleStatus = lifecycleStatus,
            createdAt = 1,
            updatedAt = 1,
        )
    }
}
