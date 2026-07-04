package ru.partnercrm.data.repository

import java.time.LocalDate
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.dashboard.DashboardSummary

interface CrmRepository {
    suspend fun partners(): List<Partner>

    suspend fun deals(): List<Deal>

    suspend fun activeDeals(): List<Deal>

    suspend fun createPartner(
        name: String,
        defaultPercent: Double,
        phone: String? = null,
        telegram: String? = null,
        comment: String? = null,
    ): Partner

    suspend fun archivePartner(partnerId: Long): Partner

    suspend fun deletePartner(partnerId: Long)

    suspend fun updatePartner(
        id: Long,
        name: String,
        defaultPercent: Double,
        phone: String? = null,
        telegram: String? = null,
        comment: String? = null,
        isActive: Boolean = true,
    ): Partner

    suspend fun createDeal(
        partnerId: Long,
        amountIn: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        percent: Double? = null,
        comment: String? = null,
    ): Deal

    suspend fun recordPayout(partnerId: Long, payoutAmount: Double, paidAt: LocalDate): List<Deal>

    suspend fun closeDeal(dealId: Long, payoutAmount: Double, returnedAt: LocalDate): List<Deal>

    suspend fun cancelDeal(dealId: Long): Deal

    suspend fun updateDeal(
        id: Long,
        partnerId: Long,
        amountIn: Double,
        percent: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        comment: String? = null,
    ): Deal

    suspend fun deleteDeal(dealId: Long)

    suspend fun settings(): AppSettings

    suspend fun updateSettings(settings: AppSettings): AppSettings

    suspend fun dashboard(today: LocalDate): DashboardSummary

    /** Полностью заменяет данные (используется для восстановления из резервной копии). */
    suspend fun replaceAll(partners: List<Partner>, deals: List<Deal>, settings: AppSettings)
}
