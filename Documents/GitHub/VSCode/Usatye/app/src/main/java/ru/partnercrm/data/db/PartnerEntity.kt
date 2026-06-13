package ru.partnercrm.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "partners")
data class PartnerEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val phone: String? = null,
    val telegram: String? = null,
    val comment: String? = null,
    val defaultPercent: Double,
    val createdAt: Long,
    val updatedAt: Long,
    val isActive: Boolean = true,
)
