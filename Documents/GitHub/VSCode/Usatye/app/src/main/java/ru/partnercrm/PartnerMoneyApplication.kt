package ru.partnercrm

import android.app.Application
import androidx.room.Room
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
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
            .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
            .build()
    }

    val repository: CrmRepository by lazy {
        RoomCrmRepository(database = database)
    }

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val reminderScheduler: ReminderScheduler by lazy {
        ReminderScheduler(applicationContext)
    }

    override fun onCreate() {
        super.onCreate()
        scheduleReminders()
    }

    fun scheduleReminders() {
        applicationScope.launch {
            reminderScheduler.scheduleAll(
                partners = repository.partners(),
                deals = repository.activeDeals(),
                settings = repository.settings(),
            )
        }
    }

    companion object {
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE deals ADD COLUMN paidOutAmount REAL NOT NULL DEFAULT 0")
                db.execSQL("UPDATE deals SET paidOutAmount = amountToReturn WHERE status = 'RETURNED'")
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("CREATE INDEX IF NOT EXISTS index_deals_partnerId_status ON deals(partnerId, status)")
            }
        }
    }
}
