package ru.partnercrm.data.repository

import java.time.Clock
import java.time.LocalDate
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.dashboard.DashboardCalculator
import ru.partnercrm.domain.dashboard.DashboardSummary
import ru.partnercrm.domain.dashboard.DealDashboardItem
import ru.partnercrm.domain.deal.DealLifecycleStatus

class InMemoryCrmRepository(
    private val clock: Clock = Clock.systemDefaultZone(),
) : CrmRepository {
    private val partners = mutableListOf<Partner>()
    private val deals = mutableListOf<Deal>()
    private var settings = AppSettings()
    private var nextPartnerId = 1L
    private var nextDealId = 1L

    override fun partners(): List<Partner> = partners.toList()

    override fun deals(): List<Deal> = deals.toList()

    override fun activeDeals(): List<Deal> {
        return deals
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .sortedBy { it.dueDate }
    }

    override fun createPartner(
        name: String,
        defaultPercent: Double,
        phone: String?,
        telegram: String?,
        comment: String?,
    ): Partner {
        val normalizedName = name.trim()
        require(normalizedName.isNotEmpty()) { "Partner name is required" }
        require(defaultPercent in 0.0..100.0) { "Partner percent must be between 0 and 100" }

        val now = clock.millis()
        val partner = Partner(
            id = nextPartnerId++,
            name = normalizedName,
            phone = phone,
            telegram = telegram,
            comment = comment,
            defaultPercent = defaultPercent,
            createdAt = now,
            updatedAt = now,
        )
        partners += partner
        return partner
    }

    override fun archivePartner(partnerId: Long): Partner {
        val index = partners.indexOfFirst { it.id == partnerId }
        require(index >= 0) { "Partner not found: $partnerId" }

        val archived = partners[index].copy(
            isActive = false,
            updatedAt = clock.millis(),
        )
        partners[index] = archived
        return archived
    }

    override fun updatePartner(
        id: Long,
        name: String,
        defaultPercent: Double,
        phone: String?,
        telegram: String?,
        comment: String?,
        isActive: Boolean,
    ): Partner {
        val index = partners.indexOfFirst { it.id == id }
        require(index >= 0) { "Partner not found: $id" }
        val normalizedName = name.trim()
        require(normalizedName.isNotEmpty()) { "Partner name is required" }
        require(defaultPercent in 0.0..100.0) { "Partner percent must be between 0 and 100" }

        val updated = partners[index].copy(
            name = normalizedName,
            phone = phone,
            telegram = telegram,
            comment = comment,
            defaultPercent = defaultPercent,
            updatedAt = clock.millis(),
            isActive = isActive,
        )
        partners[index] = updated
        return updated
    }

    override fun createDeal(
        partnerId: Long,
        amountIn: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        percent: Double?,
        comment: String?,
    ): Deal {
        val partner = partners.firstOrNull { it.id == partnerId }
            ?: throw IllegalArgumentException("Partner not found: $partnerId")
        val dealPercent = percent ?: partner.defaultPercent
        require(amountIn > 0.0) { "Deal amount must be greater than 0" }
        require(dealPercent in 0.0..100.0) { "Deal percent must be between 0 and 100" }
        require(!dueDate.isBefore(dateIn)) { "Due date cannot be before incoming date" }

        val calculation = MoneyCalculator.calculate(amountIn, dealPercent, settings.calcType)
        val now = clock.millis()
        val deal = Deal(
            id = nextDealId++,
            partnerId = partnerId,
            amountIn = amountIn,
            percent = dealPercent,
            amountToReturn = calculation.amountToReturn,
            profit = calculation.profit,
            dateIn = dateIn,
            dueDate = dueDate,
            lifecycleStatus = DealLifecycleStatus.ACTIVE,
            comment = comment,
            createdAt = now,
            updatedAt = now,
        )
        deals += deal
        return deal
    }

    override fun closeDeal(dealId: Long, returnedAt: LocalDate): Deal {
        val index = deals.indexOfFirst { it.id == dealId }
        require(index >= 0) { "Deal not found: $dealId" }

        val closed = deals[index].copy(
            dateReturned = returnedAt,
            lifecycleStatus = DealLifecycleStatus.RETURNED,
            updatedAt = clock.millis(),
        )
        deals[index] = closed
        return closed
    }

    override fun cancelDeal(dealId: Long): Deal {
        val index = deals.indexOfFirst { it.id == dealId }
        require(index >= 0) { "Deal not found: $dealId" }

        val cancelled = deals[index].copy(
            lifecycleStatus = DealLifecycleStatus.CANCELLED,
            updatedAt = clock.millis(),
        )
        deals[index] = cancelled
        return cancelled
    }

    override fun updateDeal(
        id: Long,
        partnerId: Long,
        amountIn: Double,
        percent: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        comment: String?,
    ): Deal {
        val index = deals.indexOfFirst { it.id == id }
        require(index >= 0) { "Deal not found: $id" }
        require(partners.any { it.id == partnerId }) { "Partner not found: $partnerId" }
        require(amountIn > 0.0) { "Deal amount must be greater than 0" }
        require(percent in 0.0..100.0) { "Deal percent must be between 0 and 100" }
        require(!dueDate.isBefore(dateIn)) { "Due date cannot be before incoming date" }

        val old = deals[index]
        val calculation = MoneyCalculator.calculate(amountIn, percent, settings.calcType)
        val updated = old.copy(
            partnerId = partnerId,
            amountIn = amountIn,
            percent = percent,
            amountToReturn = calculation.amountToReturn,
            profit = calculation.profit,
            dateIn = dateIn,
            dueDate = dueDate,
            comment = comment,
            updatedAt = clock.millis(),
        )
        deals[index] = updated
        return updated
    }

    override fun deleteDeal(dealId: Long) {
        deals.removeAll { it.id == dealId }
    }

    override fun settings(): AppSettings = settings

    override fun updateSettings(settings: AppSettings): AppSettings {
        this.settings = settings
        return settings
    }

    override fun replaceAll(partners: List<Partner>, deals: List<Deal>, settings: AppSettings) {
        this.partners.clear()
        this.partners.addAll(partners)
        this.deals.clear()
        this.deals.addAll(deals)
        this.settings = settings
        nextPartnerId = (partners.maxOfOrNull { it.id } ?: 0L) + 1
        nextDealId = (deals.maxOfOrNull { it.id } ?: 0L) + 1
    }

    override fun dashboard(today: LocalDate): DashboardSummary {
        return DashboardCalculator.calculate(
            deals = deals.mapNotNull { deal ->
                val partner = partners.firstOrNull { it.id == deal.partnerId } ?: return@mapNotNull null
                DealDashboardItem(
                    id = deal.id,
                    partnerId = partner.id,
                    partnerName = partner.name,
                    amountIn = deal.amountIn,
                    amountToReturn = deal.amountToReturn,
                    profit = deal.profit,
                    dueDate = deal.dueDate,
                    lifecycleStatus = deal.lifecycleStatus,
                )
            },
            today = today,
        )
    }
}
