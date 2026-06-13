package ru.partnercrm.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "app_settings",
    indices = [Index(value = ["key"], unique = true)],
)
data class AppSettingEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val key: String,
    val value: String,
)
