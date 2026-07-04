package ru.partnercrm.data.repository

import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.data.model.realizedProfit
import ru.partnercrm.data.model.remainingToReturn
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.dashboard.DashboardCalculator
import ru.partnercrm.domain.dashboard.DashboardSummary
import ru.partnercrm.domain.dashboard.DealDashboardItem
import ru.partnercrm.domain.deal.DealLifecycleStatus
import ru.partnercrm.domain.payment.PaymentAllocator

class InMemoryCrmRepository(
    private val clock: Clock = Clock.systemDefaultZone(),
) : CrmRepository {
    private val partners = mutableListOf<Partner>()
    private val deals = mutableListOf<Deal>()
    private var settings = AppSettings()
    private var nextPartnerId = 1L
    private var nextDealId = 1L

    override suspend fun partners(): List<Partner> = partners.toList()

    override suspend fun deals(): List<Deal> {
        repairFullyPaidActiveDeals()
        return deals.toList()
    }

    override suspend fun activeDeals(): List<Deal> {
        repairFullyPaidActiveDeals()
        return deals
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .sortedBy { it.dueDate }
    }

    override suspend fun createPartner(
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

    override suspend fun archivePartner(partnerId: Long): Partner {
        val index = partners.indexOfFirst { it.id == partnerId }
        require(index >= 0) { "Partner not found: $partnerId" }

        val archived = partners[index].copy(
            isActive = false,
            updatedAt = clock.millis(),
        )
        partners[index] = archived
        return archived
    }

    override suspend fun deletePartner(partnerId: Long) {
        val removed = partners.removeAll { it.id == partnerId }
        require(removed) { "Partner not found: $partnerId" }
        deals.removeAll { it.partnerId == partnerId }
    }

    override suspend fun updatePartner(
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

    override suspend fun createDeal(
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

        val roundedAmountIn = MoneyCalculator.roundMoney(amountIn)
        val calculation = MoneyCalculator.calculate(roundedAmountIn, dealPercent, settings.calcType)
        val now = clock.millis()
        val deal = Deal(
            id = nextDealId++,
            partnerId = partnerId,
            amountIn = roundedAmountIn,
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

    override suspend fun closeDeal(dealId: Long, payoutAmount: Double, returnedAt: LocalDate): List<Deal> {
        val selectedDeal = deals.firstOrNull { it.id == dealId }
            ?: throw IllegalArgumentException("Deal not found: $dealId")
        return recordPayout(selectedDeal.partnerId, payoutAmount, returnedAt)
    }

    override suspend fun recordPayout(partnerId: Long, payoutAmount: Double, paidAt: LocalDate): List<Deal> {
        require(partners.any { it.id == partnerId }) { "Partner not found: $partnerId" }
        require(payoutAmount > 0.0) { "Payout amount must be greater than 0" }

        val activePartnerDeals = deals
            .filter {
                it.partnerId == partnerId &&
                    it.lifecycleStatus == DealLifecycleStatus.ACTIVE
            }
        val totalRemaining = activePartnerDeals.sumOf { PaymentAllocator.remainingToPay(it) }
        val roundedPayout = MoneyCalculator.roundMoney(payoutAmount)
        require(totalRemaining > 0.0) { "Partner has no active deals to pay out" }
        require(roundedPayout <= totalRemaining) { "Payout amount exceeds remaining return amount" }

        val updatedDeals = PaymentAllocator.allocate(activePartnerDeals, roundedPayout, paidAt)
            .map { repairFullyPaidActiveDeal(it, paidAt) }
            .map { it.copy(updatedAt = clock.millis()) }
        val updatedById = updatedDeals.associateBy { it.id }
        deals.replaceAll { deal -> updatedById[deal.id] ?: deal }
        return updatedDeals
    }

    override suspend fun cancelDeal(dealId: Long): Deal {
        val index = deals.indexOfFirst { it.id == dealId }
        require(index >= 0) { "Deal not found: $dealId" }

        val cancelled = deals[index].copy(
            lifecycleStatus = DealLifecycleStatus.CANCELLED,
            updatedAt = clock.millis(),
        )
        deals[index] = cancelled
        return cancelled
    }

    override suspend fun updateDeal(
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
        val roundedAmountIn = MoneyCalculator.roundMoney(amountIn)
        val calculation = MoneyCalculator.calculate(roundedAmountIn, percent, settings.calcType)
        val paidOutAmount = minOf(old.paidOutAmount, calculation.amountToReturn)
        val updated = old.copy(
            partnerId = partnerId,
            amountIn = roundedAmountIn,
            percent = percent,
            amountToReturn = calculation.amountToReturn,
            profit = calculation.profit,
            paidOutAmount = paidOutAmount,
            dateIn = dateIn,
            dueDate = dueDate,
            comment = comment,
            updatedAt = clock.millis(),
        )
        deals[index] = updated
        return updated
    }

    override suspend fun deleteDeal(dealId: Long) {
        deals.removeAll { it.id == dealId }
    }

    override suspend fun settings(): AppSettings = settings

    override suspend fun updateSettings(settings: AppSettings): AppSettings {
        this.settings = settings
        return settings
    }

    override suspend fun replaceAll(partners: List<Partner>, deals: List<Deal>, settings: AppSettings) {
        this.partners.clear()
        this.partners.addAll(partners)
        this.deals.clear()
        this.deals.addAll(deals)
        this.settings = settings
        nextPartnerId = (partners.maxOfOrNull { it.id } ?: 0L) + 1
        nextDealId = (deals.maxOfOrNull { it.id } ?: 0L) + 1
    }

    override suspend fun dashboard(today: LocalDate): DashboardSummary {
        repairFullyPaidActiveDeals()
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
                    paidOutAmount = deal.paidOutAmount,
                    dueDate = deal.dueDate,
                    lifecycleStatus = deal.lifecycleStatus,
                )
            },
            today = today,
        )
    }

    private fun repairFullyPaidActiveDeals() {
        deals.replaceAll { repairFullyPaidActiveDeal(it, returnedAt = null) }
    }

    private fun repairFullyPaidActiveDeal(deal: Deal, returnedAt: LocalDate?): Deal {
        if (deal.lifecycleStatus != DealLifecycleStatus.ACTIVE) return deal
        if (PaymentAllocator.remainingToPay(deal) > 0.0) return deal

        val repairedReturnedAt = returnedAt
            ?: deal.dateReturned
            ?: Instant.ofEpochMilli(deal.updatedAt).atZone(clock.zone).toLocalDate()
        return deal.copy(
            profit = deal.copy(lifecycleStatus = DealLifecycleStatus.RETURNED).realizedProfit(),
            dateReturned = repairedReturnedAt,
            lifecycleStatus = DealLifecycleStatus.RETURNED,
        )
    }
}
