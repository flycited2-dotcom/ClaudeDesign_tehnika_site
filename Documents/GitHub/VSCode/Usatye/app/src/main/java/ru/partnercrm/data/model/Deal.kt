package ru.partnercrm.data.model

import java.time.LocalDate
import ru.partnercrm.domain.deal.DealLifecycleStatus

data class Deal(
    val id: Long,
    val partnerId: Long,
    val amountIn: Double,
    val percent: Double,
    val amountToReturn: Double,
    val profit: Double,
    val dateIn: LocalDate,
    val dueDate: LocalDate,
    val dateReturned: LocalDate? = null,
    val lifecycleStatus: DealLifecycleStatus,
    val comment: String? = null,
    val createdAt: Long,
    val updatedAt: Long,
)
