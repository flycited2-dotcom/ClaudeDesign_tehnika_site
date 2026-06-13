package ru.partnercrm.notifications

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import ru.partnercrm.PartnerMoneyApplication

class ReminderRescheduleWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        (applicationContext as? PartnerMoneyApplication)?.scheduleReminders()
        return Result.success()
    }
}
