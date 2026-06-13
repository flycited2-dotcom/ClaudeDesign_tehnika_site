package ru.partnercrm.data.model

data class Partner(
    val id: Long,
    val name: String,
    val phone: String? = null,
    val telegram: String? = null,
    val comment: String? = null,
    val defaultPercent: Double,
    val createdAt: Long,
    val updatedAt: Long,
    val isActive: Boolean = true,
)
