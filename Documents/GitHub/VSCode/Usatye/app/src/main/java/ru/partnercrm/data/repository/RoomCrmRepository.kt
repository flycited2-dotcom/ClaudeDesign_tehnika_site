package ru.partnercrm.data.repository

import java.time.Clock
import java.time.LocalDate
import kotlinx.coroutines.runBlocking
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
import ru.partnercrm.domain.calculator.CalcType
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.dashboard.DashboardCalculator
import ru.partnercrm.domain.dashboard.DashboardSummary
import ru.partnercrm.domain.dashboard.DealDashboardItem
import ru.partnercrm.domain.deal.DealLifecycleStatus

class RoomCrmRepository(
    private val partnerDao: PartnerDao,
    private val dealDao: DealDao,
    private val settingsDao: SettingsDao? = null,
    private val clock: Clock = Clock.systemDefaultZone(),
) : CrmRepository {
    override fun partners(): List<Partner> = runBlocking {
        partnerDao.getAll().map { it.toModel() }
    }

    override fun deals(): List<Deal> = runBlocking {
        dealDao.getAll().map { it.toModel() }
    }

    override fun activeDeals(): List<Deal> {
        return deals()
            .filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
            .sortedBy { it.dueDate }
    }

    override fun createPartner(
        name: String,
        defaultPercent: Double,
        phone: String?,
        telegram: String?,
        comment: String?,
    ): Partner = runBlocking {
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

    override fun archivePartner(partnerId: Long): Partner = runBlocking {
        partnerDao.archive(partnerId, clock.millis())
        requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }.toModel()
    }

    override fun updatePartner(
        id: Long,
        name: String,
        defaultPercent: Double,
        phone: String?,
        telegram: String?,
        comment: String?,
        isActive: Boolean,
    ): Partner = runBlocking {
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

    override fun createDeal(
        partnerId: Long,
        amountIn: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        percent: Double?,
        comment: String?,
    ): Deal = runBlocking {
        val partner = requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }
        val dealPercent = percent ?: partner.defaultPercent
        require(amountIn > 0.0) { "Deal amount must be greater than 0" }
        require(dealPercent in 0.0..100.0) { "Deal percent must be between 0 and 100" }
        require(!dueDate.isBefore(dateIn)) { "Due date cannot be before incoming date" }

        val calculation = MoneyCalculator.calculate(amountIn, dealPercent, readCalcType())
        val now = clock.millis()
        val id = dealDao.insert(
            DealEntity(
                partnerId = partnerId,
                amountIn = amountIn,
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

    override fun closeDeal(dealId: Long, returnedAt: LocalDate): Deal = runBlocking {
        val deal = requireNotNull(dealDao.getById(dealId)) { "Deal not found: $dealId" }
        val closed = deal.copy(
            dateReturned = returnedAt.toEpochDay(),
            status = DealLifecycleStatus.RETURNED.name,
            updatedAt = clock.millis(),
        )
        dealDao.update(closed)
        requireNotNull(dealDao.getById(dealId)) { "Deal not found after update: $dealId" }.toModel()
    }

    override fun cancelDeal(dealId: Long): Deal = runBlocking {
        val deal = requireNotNull(dealDao.getById(dealId)) { "Deal not found: $dealId" }
        val cancelled = deal.copy(
            status = DealLifecycleStatus.CANCELLED.name,
            updatedAt = clock.millis(),
        )
        dealDao.update(cancelled)
        requireNotNull(dealDao.getById(dealId)) { "Deal not found after update: $dealId" }.toModel()
    }

    override fun updateDeal(
        id: Long,
        partnerId: Long,
        amountIn: Double,
        percent: Double,
        dateIn: LocalDate,
        dueDate: LocalDate,
        comment: String?,
    ): Deal = runBlocking {
        val existing = requireNotNull(dealDao.getById(id)) { "Deal not found: $id" }
        requireNotNull(partnerDao.getById(partnerId)) { "Partner not found: $partnerId" }
        require(amountIn > 0.0) { "Deal amount must be greater than 0" }
        require(percent in 0.0..100.0) { "Deal percent must be between 0 and 100" }
        require(!dueDate.isBefore(dateIn)) { "Due date cannot be before incoming date" }

        val calculation = MoneyCalculator.calculate(amountIn, percent, readCalcType())
        val updated = existing.copy(
            partnerId = partnerId,
            amountIn = amountIn,
            percent = percent,
            amountToReturn = calculation.amountToReturn,
            profit = calculation.profit,
            dateIn = dateIn.toEpochDay(),
            dueDate = dueDate.toEpochDay(),
            comment = comment,
            updatedAt = clock.millis(),
        )
        dealDao.update(updated)
        requireNotNull(dealDao.getById(id)) { "Deal not found after update: $id" }.toModel()
    }

    override fun deleteDeal(dealId: Long) = runBlocking {
        dealDao.delete(dealId)
    }

    override fun settings(): AppSettings = runBlocking {
        val dao = settingsDao ?: return@runBlocking AppSettings()
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

    override fun updateSettings(settings: AppSettings): AppSettings = runBlocking {
        val dao = settingsDao ?: return@runBlocking settings
        writeSettings(dao, settings)
        settings
    }

    override fun replaceAll(partners: List<Partner>, deals: List<Deal>, settings: AppSettings) = runBlocking {
        dealDao.deleteAll()
        partnerDao.deleteAll()
        partners.forEach { partnerDao.insertWithId(it.toEntity()) }
        deals.forEach { dealDao.insertWithId(it.toEntity()) }
        settingsDao?.let { writeSettings(it, settings) }
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

    override fun dashboard(today: LocalDate): DashboardSummary {
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
                dueDate = deal.dueDate,
                lifecycleStatus = deal.lifecycleStatus,
            )
        }
        return DashboardCalculator.calculate(dashboardDeals, today)
    }

    private suspend fun SettingsDao.booleanValue(key: String, defaultValue: Boolean): Boolean {
        return getValue(key)?.toBooleanStrictOrNull() ?: defaultValue
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
