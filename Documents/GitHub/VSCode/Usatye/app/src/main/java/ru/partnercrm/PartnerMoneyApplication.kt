package ru.partnercrm

import android.app.Application
import androidx.room.Room
import ru.partnercrm.data.db.AppDatabase
import ru.partnercrm.data.repository.CrmRepository
import ru.partnercrm.data.repository.RoomCrmRepository
import ru.partnercrm.notifications.ReminderScheduler

class PartnerMoneyApplication : Application() {
    private val database: AppDatabase by lazy {
        Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "partner_money_reminder.db",
        )
            .allowMainThreadQueries()
            .build()
    }

    val repository: CrmRepository by lazy {
        RoomCrmRepository(
            partnerDao = database.partnerDao(),
            dealDao = database.dealDao(),
            settingsDao = database.settingsDao(),
        )
    }

    private val reminderScheduler: ReminderScheduler by lazy {
        ReminderScheduler(applicationContext)
    }

    override fun onCreate() {
        super.onCreate()
        scheduleReminders()
    }

    fun scheduleReminders() {
        reminderScheduler.scheduleAll(
            partners = repository.partners(),
            deals = repository.activeDeals(),
            settings = repository.settings(),
        )
    }
}
