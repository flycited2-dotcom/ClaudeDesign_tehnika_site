package ru.partnercrm.data.repository

import java.time.LocalDate
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.dashboard.DashboardSummary

interface CrmRepository {
    fun partners(): List<Partner>

    fun deals(): List<Deal>

    fun activeDeals(): List<Deal>

    fun createPartner(
        name: String,
        defaultPercent: Double,
        phone: String? = null,
        telegram: String? = null,
        comment: String? = null,
    ): Partner

    fun archivePartner(partnerId: Long): Partner

    fun updatePartner(
        id: Long,
        name: String,
        defaultPercent: Double,
        phone: String? = null,
        telegram: String? = null,
        comment: String? = null,
        isActive: Boolean = true,
    ): Partner

    fun createDeal(
        partnerId: Long,
        amountIn: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        percent: Double? = null,
        comment: String? = null,
    ): Deal

    fun closeDeal(dealId: Long, returnedAt: LocalDate): Deal

    fun cancelDeal(dealId: Long): Deal

    fun updateDeal(
        id: Long,
        partnerId: Long,
        amountIn: Double,
        percent: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        comment: String? = null,
    ): Deal

    fun deleteDeal(dealId: Long)

    fun settings(): AppSettings

    fun updateSettings(settings: AppSettings): AppSettings

    fun dashboard(today: LocalDate): DashboardSummary

    /** Полностью заменяет данные (используется для восстановления из резервной копии). */
    fun replaceAll(partners: List<Partner>, deals: List<Deal>, settings: AppSettings)
}
