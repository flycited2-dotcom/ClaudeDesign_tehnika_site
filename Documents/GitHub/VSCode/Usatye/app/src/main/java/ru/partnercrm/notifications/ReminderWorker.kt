package ru.partnercrm.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.time.LocalDate
import ru.partnercrm.MainActivity

class ReminderWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val dealId = inputData.getLong(KEY_DEAL_ID, -1L)
        val type = inputData.getString(KEY_TYPE)
            ?.let { runCatching { ReminderType.valueOf(it) }.getOrNull() }
            ?: return Result.failure()
        val dueDate = inputData.getString(KEY_DUE_DATE)
            ?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            ?: return Result.failure()
        val partnerName = inputData.getString(KEY_PARTNER_NAME) ?: "Партнёр"
        val amountToReturn = inputData.getDouble(KEY_AMOUNT_TO_RETURN, 0.0)
        val currencySymbol = inputData.getString(KEY_CURRENCY_SYMBOL) ?: "₽"

        if (!canPostNotifications()) return Result.success()

        ensureChannel()
        val message = ReminderMessageFormatter.format(
            type = type,
            partnerName = partnerName,
            amountToReturn = amountToReturn,
            dueDate = dueDate,
            currencySymbol = currencySymbol,
        )
        val intent = Intent(applicationContext, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            dealId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(message.title)
            .setContentText(message.body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message.body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        try {
            NotificationManagerCompat.from(applicationContext).notify(notificationId(dealId, type), notification)
        } catch (_: SecurityException) {
            return Result.success()
        }
        return Result.success()
    }

    private fun canPostNotifications(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(applicationContext, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
    }

    private fun ensureChannel() {
        val manager = applicationContext.getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Напоминания по сделкам",
            NotificationManager.IMPORTANCE_DEFAULT,
        )
        manager.createNotificationChannel(channel)
    }

    private fun notificationId(dealId: Long, type: ReminderType): Int {
        return 31 * dealId.hashCode() + type.ordinal
    }

    companion object {
        const val CHANNEL_ID = "deal_reminders"
        const val KEY_DEAL_ID = "deal_id"
        const val KEY_TYPE = "type"
        const val KEY_PARTNER_NAME = "partner_name"
        const val KEY_AMOUNT_TO_RETURN = "amount_to_return"
        const val KEY_DUE_DATE = "due_date"
        const val KEY_CURRENCY_SYMBOL = "currency_symbol"
    }
}
