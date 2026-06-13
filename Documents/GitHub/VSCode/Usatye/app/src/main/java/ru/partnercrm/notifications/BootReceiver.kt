package ru.partnercrm.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import ru.partnercrm.PartnerMoneyApplication

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            (context.applicationContext as? PartnerMoneyApplication)?.scheduleReminders()
        }
    }
}
