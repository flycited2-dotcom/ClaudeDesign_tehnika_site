package ru.partnercrm.data.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        PartnerEntity::class,
        DealEntity::class,
        AppSettingEntity::class,
    ],
    version = 3,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun partnerDao(): PartnerDao
    abstract fun dealDao(): DealDao
    abstract fun settingsDao(): SettingsDao
}
