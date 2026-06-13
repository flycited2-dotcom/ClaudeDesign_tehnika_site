package ru.partnercrm.notifications

import android.content.Context
import androidx.work.ExistingWorkPolicy
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.time.Clock
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner

class ReminderScheduler(
    context: Context,
    private val clock: Clock = Clock.systemDefaultZone(),
) {
    private val appContext = context.applicationContext

    fun scheduleAll(
        partners: List<Partner>,
        deals: List<Deal>,
        settings: AppSettings,
    ) {
        val workManager = WorkManager.getInstance(appContext)
        workManager.cancelAllWorkByTag(TAG)
        val notifyTime = parseNotifyTime(settings.notifyTime)
        ensureDailyReschedule(workManager, settings, notifyTime)

        val partnersById = partners.associateBy { it.id }
        val dealsById = deals.associateBy { it.id }
        ReminderPlanner.upcoming(
            deals = deals,
            today = LocalDate.now(clock),
            settings = settings,
        ).forEach { plan ->
            val deal = dealsById[plan.dealId] ?: return@forEach
            val partner = partnersById[deal.partnerId] ?: return@forEach
            val request = OneTimeWorkRequestBuilder<ReminderWorker>()
                .setInputData(
                    workDataOf(
                        ReminderWorker.KEY_DEAL_ID to deal.id,
                        ReminderWorker.KEY_TYPE to plan.type.name,
                        ReminderWorker.KEY_PARTNER_NAME to partner.name,
                        ReminderWorker.KEY_AMOUNT_TO_RETURN to deal.amountToReturn,
                        ReminderWorker.KEY_DUE_DATE to deal.dueDate.toString(),
                        ReminderWorker.KEY_CURRENCY_SYMBOL to settings.currencySymbol,
                    ),
                )
                .setInitialDelay(delayUntil(plan.triggerDate, notifyTime), TimeUnit.MILLISECONDS)
                .addTag(TAG)
                .build()

            workManager.enqueueUniqueWork(uniqueName(plan), ExistingWorkPolicy.REPLACE, request)
        }
    }

    private fun ensureDailyReschedule(workManager: WorkManager, settings: AppSettings, notifyTime: LocalTime) {
        if (!settings.remindersEnabled) {
            workManager.cancelUniqueWork(DAILY_RESCHEDULE_WORK)
            return
        }

        val request = PeriodicWorkRequestBuilder<ReminderRescheduleWorker>(1, TimeUnit.DAYS)
            .setInitialDelay(delayUntil(LocalDate.now(clock).plusDays(1), notifyTime), TimeUnit.MILLISECONDS)
            .build()
        workManager.enqueueUniquePeriodicWork(
            DAILY_RESCHEDULE_WORK,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }

    private fun delayUntil(triggerDate: LocalDate, time: LocalTime): Long {
        val now = ZonedDateTime.now(clock)
        val triggerAt = triggerDate.atTime(time).atZone(clock.zone)
        return Duration.between(now, triggerAt).toMillis().coerceAtLeast(0L)
    }

    private fun parseNotifyTime(raw: String): LocalTime {
        return runCatching { LocalTime.parse(raw) }.getOrDefault(LocalTime.of(9, 0))
    }

    private fun uniqueName(plan: ReminderPlan): String {
        return "deal-reminder-${plan.dealId}-${plan.type.name}"
    }

    companion object {
        private const val TAG = "deal-reminders"
        private const val DAILY_RESCHEDULE_WORK = "daily-reminder-reschedule"
    }
}
