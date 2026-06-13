package ru.partnercrm.data.db

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "deals",
    foreignKeys = [
        ForeignKey(
            entity = PartnerEntity::class,
            parentColumns = ["id"],
            childColumns = ["partnerId"],
            onDelete = ForeignKey.RESTRICT,
        ),
    ],
    indices = [Index("partnerId"), Index("dueDate"), Index("status")],
)
data class DealEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val partnerId: Long,
    val amountIn: Double,
    val percent: Double,
    val amountToReturn: Double,
    val profit: Double,
    val dateIn: Long,
    val dueDate: Long,
    val dateReturned: Long? = null,
    val status: String,
    val comment: String? = null,
    val createdAt: Long,
    val updatedAt: Long,
)
