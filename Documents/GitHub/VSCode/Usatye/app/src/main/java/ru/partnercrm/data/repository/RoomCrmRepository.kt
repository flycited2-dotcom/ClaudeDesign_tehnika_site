package ru.partnercrm.data.repository

import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import androidx.room.RoomDatabase
import androidx.room.withTransaction
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import ru.partnercrm.data.db.AppDatabase
import ru.partnercrm.data.db.DealDao
import ru.partnercrm.data.db.DealEntity
import ru.partnercrm.data.db.PartnerDao
import ru.partnercrm.data.db.PartnerEntity
import ru.partnercrm.data.db.SettingsDao
import ru.partnercrm.data.db.AppSettingEntity
import ru.partnercrm.data.db.toModel
import ru.partnercrm.data.db.toEntity
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.data.model.realizedProfit
import ru.partnercrm.domain.calculator.CalcType
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.dashboard.DashboardCalculator
import ru.partnercrm.domain.dashboard.DashboardSummary
import ru.partnercrm.domain.dashboard.DealDashboardItem
import ru.partnercrm.domain.deal.DealLifecycleStatus
import ru.partnercrm.domain.payment.PaymentAllocator

class RoomCrmRepository(
    private val partnerDao: PartnerDao,
    private val dealDao: DealDao,
    private val settingsDao: SettingsDao? = null,
    private val clock: Clock = Clock.systemDefaultZone(),
    private val database: RoomDatabase? = null,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
) : CrmRepository {
    constructor(
        database: AppDatabase,
        clock: Clock = Clock.systemDefaultZone(),
        ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
    ) : this(
        partnerDao = database.partnerDao(),
        dealDao = database.dealDao(),
        settingsDao = database.settingsDao(),
        clock = clock,
        database = database,
        ioDispatcher = ioDispatcher,
    )

    override suspend fun partners(): List<Partner> = dbCall {
        partnerDao.getAll().map { it.toModel() }
    }

    override suspend fun deals(): List<Deal> = dbCall {
        repairFullyPaidActiveDeals(dealDao.getAll())
    }

    override suspend fun activeDeals(): List<Deal> {
        return deals()
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .sortedBy { it.dueDate }
    }

    override suspend fun createPartner(
        name: String,
        defaultPercent: Double,
        phone: String?,
        telegram: String?,
        comment: String?,
    ): Partner = dbCall {
        val normalizedName = name.trim()
        require(normalizedName.isNotEmpty()) { "Partner name is required" }
        require(defaultPercent in 0.0..100.0) { "Partner percent must be between 0 and 100" }

        val now = clock.millis()
        val id = partnerDao.insert(
            PartnerEntity(
                name = normalizedName,
                phone = phone,
                telegram = telegram,
                comment = comment,
                defaultPercent = defaultPercent,
                createdAt = now,
                updatedAt = now,
            ),
        )
        requireNotNull(partnerDao.getById(id)) { "Inserted partner not found: $id" }.toModel()
    }

    override suspend fun archivePartner(partnerId: Long): Partner = dbCall {
        partnerDao.archive(partnerId, clock.millis())
        requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }.toModel()
    }

    override suspend fun deletePartner(partnerId: Long) = dbCall {
        inTransaction {
            requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }
            dealDao.deleteByPartner(partnerId)
            partnerDao.delete(partnerId)
        }
    }

    override suspend fun updatePartner(
        id: Long,
        name: String,
        defaultPercent: Double,
        phone: String?,
        telegram: String?,
        comment: String?,
        isActive: Boolean,
    ): Partner = dbCall {
        val existing = requireNotNull(partnerDao.getById(id)) { "Partner not found: $id" }
        val normalizedName = name.trim()
        require(normalizedName.isNotEmpty()) { "Partner name is required" }
        require(defaultPercent in 0.0..100.0) { "Partner percent must be between 0 and 100" }

        val updated = existing.copy(
            name = normalizedName,
            phone = phone,
            telegram = telegram,
            comment = comment,
            defaultPercent = defaultPercent,
            updatedAt = clock.millis(),
            isActive = isActive,
        )
        partnerDao.update(updated)
        requireNotNull(partnerDao.getById(id)) { "Partner not found after update: $id" }.toModel()
    }

    override suspend fun createDeal(
        partnerId: Long,
        amountIn: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        percent: Double?,
        comment: String?,
    ): Deal = dbCall {
        val partner = requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }
        val dealPercent = percent ?: partner.defaultPercent
        require(amountIn > 0.0) { "Deal amount must be greater than 0" }
        require(dealPercent in 0.0..100.0) { "Deal percent must be between 0 and 100" }
        require(!dueDate.isBefore(dateIn)) { "Due date cannot be before incoming date" }

        val roundedAmountIn = MoneyCalculator.roundMoney(amountIn)
        val calculation = MoneyCalculator.calculate(roundedAmountIn, dealPercent, readCalcType())
        val now = clock.millis()
        val id = dealDao.insert(
            DealEntity(
                partnerId = partnerId,
                amountIn = roundedAmountIn,
                percent = dealPercent,
                amountToReturn = calculation.amountToReturn,
                profit = calculation.profit,
                dateIn = dateIn.toEpochDay(),
                dueDate = dueDate.toEpochDay(),
                status = DealLifecycleStatus.ACTIVE.name,
                comment = comment,
                createdAt = now,
                updatedAt = now,
            ),
        )
        requireNotNull(dealDao.getById(id)) { "Inserted deal not found: $id" }.toModel()
    }

    override suspend fun closeDeal(dealId: Long, payoutAmount: Double, returnedAt: LocalDate): List<Deal> {
        val deal = dbCall {
            requireNotNull(dealDao.getById(dealId)) { "Deal not found: $dealId" }
        }
        return recordPayout(deal.partnerId, payoutAmount, returnedAt)
    }

    override suspend fun recordPayout(partnerId: Long, payoutAmount: Double, paidAt: LocalDate): List<Deal> = dbCall {
        inTransaction {
            requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }
            require(payoutAmount > 0.0) { "Payout amount must be greater than 0" }

            val activePartnerDeals = dealDao.getAll()
                .map { it.toModel() }
                .filter {
                    it.partnerId == partnerId &&
                        it.lifecycleStatus == DealLifecycleStatus.ACTIVE
                }
            val totalRemaining = activePartnerDeals.sumOf { PaymentAllocator.remainingToPay(it) }
            val roundedPayout = MoneyCalculator.roundMoney(payoutAmount)
            require(totalRemaining > 0.0) { "Partner has no active deals to pay out" }
            require(roundedPayout <= totalRemaining) { "Payout amount exceeds remaining return amount" }

            val now = clock.millis()
            val updatedDeals = PaymentAllocator.allocate(activePartnerDeals, roundedPayout, paidAt)
                .map { repairFullyPaidActiveDeal(it, paidAt) }
                .map { it.copy(updatedAt = now) }
            updatedDeals.forEach { dealDao.update(it.toEntity()) }
            updatedDeals.map { updated ->
                requireNotNull(dealDao.getById(updated.id)) { "Deal not found after update: ${updated.id}" }.toModel()
            }
        }
    }

    override suspend fun cancelDeal(dealId: Long): Deal = dbCall {
        val deal = requireNotNull(dealDao.getById(dealId)) { "Deal not found: $dealId" }
        val cancelled = deal.copy(
            status = DealLifecycleStatus.CANCELLED.name,
            updatedAt = clock.millis(),
        )
        dealDao.update(cancelled)
        requireNotNull(dealDao.getById(dealId)) { "Deal not found after update: $dealId" }.toModel()
    }

    override suspend fun updateDeal(
        id: Long,
        partnerId: Long,
        amountIn: Double,
        percent: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        comment: String?,
    ): Deal = dbCall {
        val existing = requireNotNull(dealDao.getById(id)) { "Deal not found: $id" }
        requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }
        require(amountIn > 0.0) { "Deal amount must be greater than 0" }
        require(percent in 0.0..100.0) { "Deal percent must be between 0 and 100" }
        require(!dueDate.isBefore(dateIn)) { "Due date cannot be before incoming date" }

        val roundedAmountIn = MoneyCalculator.roundMoney(amountIn)
        val calculation = MoneyCalculator.calculate(roundedAmountIn, percent, readCalcType())
        val paidOutAmount = minOf(existing.paidOutAmount, calculation.amountToReturn)
        val updated = existing.copy(
            partnerId = partnerId,
            amountIn = roundedAmountIn,
            percent = percent,
            amountToReturn = calculation.amountToReturn,
            profit = calculation.profit,
            paidOutAmount = paidOutAmount,
            dateIn = dateIn.toEpochDay(),
            dueDate = dueDate.toEpochDay(),
            comment = comment,
            updatedAt = clock.millis(),
        )
        dealDao.update(updated)
        requireNotNull(dealDao.getById(id)) { "Deal not found after update: $id" }.toModel()
    }

    private suspend fun repairFullyPaidActiveDeals(entities: List<DealEntity>): List<Deal> {
        return entities.map { entity ->
            val deal = entity.toModel()
            val repaired = repairFullyPaidActiveDeal(deal, returnedAt = null)
            if (repaired != deal) {
                dealDao.update(repaired.toEntity())
            }
            repaired
        }
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

    override suspend fun deleteDeal(dealId: Long) = dbCall {
        dealDao.delete(dealId)
    }

    override suspend fun settings(): AppSettings = dbCall {
        val dao = settingsDao ?: return@dbCall AppSettings()
        AppSettings(
            remindersEnabled = dao.booleanValue(SettingsKeys.REMINDERS_ENABLED, true),
            remindThreeDaysBefore = dao.booleanValue(SettingsKeys.REMIND_THREE_DAYS_BEFORE, true),
            remindOneDayBefore = dao.booleanValue(SettingsKeys.REMIND_ONE_DAY_BEFORE, true),
            remindOnDueDate = dao.booleanValue(SettingsKeys.REMIND_ON_DUE_DATE, true),
            remindOverdueDaily = dao.booleanValue(SettingsKeys.REMIND_OVERDUE_DAILY, true),
            currencySymbol = dao.getValue(SettingsKeys.CURRENCY_SYMBOL) ?: "₽",
            notifyTime = dao.getValue(SettingsKeys.NOTIFY_TIME) ?: "09:00",
            hideAmounts = dao.booleanValue(SettingsKeys.HIDE_AMOUNTS, false),
            calcType = dao.getValue(SettingsKeys.CALC_TYPE)
                ?.let { runCatching { CalcType.valueOf(it) }.getOrNull() } ?: CalcType.DISCOUNT,
        )
    }

    override suspend fun updateSettings(settings: AppSettings): AppSettings = dbCall {
        val dao = settingsDao ?: return@dbCall settings
        writeSettings(dao, settings)
        settings
    }

    override suspend fun replaceAll(partners: List<Partner>, deals: List<Deal>, settings: AppSettings) = dbCall {
        inTransaction {
            dealDao.deleteAll()
            partnerDao.deleteAll()
            partners.forEach { partnerDao.insertWithId(it.toEntity()) }
            deals.forEach { dealDao.insertWithId(it.toEntity()) }
            settingsDao?.let { writeSettings(it, settings) }
        }
        Unit
    }

    private suspend fun writeSettings(dao: SettingsDao, settings: AppSettings) {
        dao.upsert(AppSettingEntity(key = SettingsKeys.REMINDERS_ENABLED, value = settings.remindersEnabled.toString()))
        dao.upsert(AppSettingEntity(key = SettingsKeys.REMIND_THREE_DAYS_BEFORE, value = settings.remindThreeDaysBefore.toString()))
        dao.upsert(AppSettingEntity(key = SettingsKeys.REMIND_ONE_DAY_BEFORE, value = settings.remindOneDayBefore.toString()))
        dao.upsert(AppSettingEntity(key = SettingsKeys.REMIND_ON_DUE_DATE, value = settings.remindOnDueDate.toString()))
        dao.upsert(AppSettingEntity(key = SettingsKeys.REMIND_OVERDUE_DAILY, value = settings.remindOverdueDaily.toString()))
        dao.upsert(AppSettingEntity(key = SettingsKeys.CURRENCY_SYMBOL, value = settings.currencySymbol))
        dao.upsert(AppSettingEntity(key = SettingsKeys.NOTIFY_TIME, value = settings.notifyTime))
        dao.upsert(AppSettingEntity(key = SettingsKeys.HIDE_AMOUNTS, value = settings.hideAmounts.toString()))
        dao.upsert(AppSettingEntity(key = SettingsKeys.CALC_TYPE, value = settings.calcType.name))
    }

    private suspend fun readCalcType(): CalcType {
        val raw = settingsDao?.getValue(SettingsKeys.CALC_TYPE) ?: return CalcType.DISCOUNT
        return runCatching { CalcType.valueOf(raw) }.getOrDefault(CalcType.DISCOUNT)
    }

    override suspend fun dashboard(today: LocalDate): DashboardSummary {
        val partnersById = partners().associateBy { it.id }
        val dashboardDeals = deals().mapNotNull { deal ->
            val partner = partnersById[deal.partnerId] ?: return@mapNotNull null
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
        }
        return DashboardCalculator.calculate(dashboardDeals, today)
    }

    private suspend fun SettingsDao.booleanValue(key: String, defaultValue: Boolean): Boolean {
        return getValue(key)?.toBooleanStrictOrNull() ?: defaultValue
    }

    private suspend fun <T> dbCall(block: suspend () -> T): T {
        return withContext(ioDispatcher) { block() }
    }

    private suspend fun <T> inTransaction(block: suspend () -> T): T {
        val room = database ?: return block()
        return room.withTransaction { block() }
    }

    private object SettingsKeys {
        const val REMINDERS_ENABLED = "reminders_enabled"
        const val REMIND_THREE_DAYS_BEFORE = "remind_three_days_before"
        const val REMIND_ONE_DAY_BEFORE = "remind_one_day_before"
        const val REMIND_ON_DUE_DATE = "remind_on_due_date"
        const val REMIND_OVERDUE_DAILY = "remind_overdue_daily"
        const val CURRENCY_SYMBOL = "currency_symbol"
        const val NOTIFY_TIME = "notify_time"
        const val HIDE_AMOUNTS = "hide_amounts"
        const val CALC_TYPE = "calc_type"
    }
}
