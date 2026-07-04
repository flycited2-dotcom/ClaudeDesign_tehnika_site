package ru.partnercrm.data.repository

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import ru.partnercrm.data.db.AppSettingEntity
import ru.partnercrm.data.db.DealDao
import ru.partnercrm.data.db.DealEntity
import ru.partnercrm.data.db.PartnerDao
import ru.partnercrm.data.db.PartnerEntity
import ru.partnercrm.data.db.SettingsDao
import ru.partnercrm.data.db.toEntity
import ru.partnercrm.domain.deal.DealLifecycleStatus
import ru.partnercrm.data.model.AppSettings

class RoomCrmRepositoryTest {
    private val today = LocalDate.of(2026, 6, 8)

    @Test
    fun `creates deal through dao with calculated return amount and profit`() = runBlocking {
        val partnerDao = FakePartnerDao()
        val dealDao = FakeDealDao()
        val repository = RoomCrmRepository(partnerDao = partnerDao, dealDao = dealDao)
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 10.0)

        val deal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        assertEquals(10.0, deal.percent)
        assertEquals(90_000.0, deal.amountToReturn)
        assertEquals(10_000.0, deal.profit)
        assertEquals(DealLifecycleStatus.ACTIVE, deal.lifecycleStatus)
    }

    @Test
    fun `closes deal through dao and excludes it from active deals`() = runBlocking {
        val partnerDao = FakePartnerDao()
        val dealDao = FakeDealDao()
        val repository = RoomCrmRepository(partnerDao = partnerDao, dealDao = dealDao)
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 10.0)
        val deal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        repository.closeDeal(deal.id, payoutAmount = deal.amountToReturn, returnedAt = today.plusDays(1))

        assertEquals(emptyList(), repository.activeDeals())
        assertEquals(DealLifecycleStatus.RETURNED, repository.deals().single().lifecycleStatus)
    }

    @Test
    fun `records payout through dao by oldest partner deals and leaves partial active`() = runBlocking {
        val partnerDao = FakePartnerDao()
        val dealDao = FakeDealDao()
        val repository = RoomCrmRepository(partnerDao = partnerDao, dealDao = dealDao)
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 0.0)
        val first = repository.createDeal(
            partnerId = partner.id,
            amountIn = 300_000.0,
            dateIn = today.minusDays(2),
            dueDate = today.plusDays(7),
        )
        val second = repository.createDeal(
            partnerId = partner.id,
            amountIn = 300_000.0,
            dateIn = today.minusDays(1),
            dueDate = today.plusDays(8),
        )

        repository.recordPayout(partnerId = partner.id, payoutAmount = 500_000.0, paidAt = today)

        val deals = repository.deals()
        assertEquals(300_000.0, deals.single { it.id == first.id }.paidOutAmount)
        assertEquals(DealLifecycleStatus.RETURNED, deals.single { it.id == first.id }.lifecycleStatus)
        assertEquals(200_000.0, deals.single { it.id == second.id }.paidOutAmount)
        assertEquals(DealLifecycleStatus.ACTIVE, deals.single { it.id == second.id }.lifecycleStatus)
    }

    @Test
    fun `repairs fully paid active deal when reading from dao`() = runBlocking {
        val partnerDao = FakePartnerDao()
        val dealDao = FakeDealDao()
        val repository = RoomCrmRepository(partnerDao = partnerDao, dealDao = dealDao)
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 0.0)
        val deal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 300_000.0,
            dateIn = today.minusDays(2),
            dueDate = today.plusDays(7),
        )
        dealDao.update(
            deal.toEntity().copy(
                paidOutAmount = deal.amountToReturn,
                status = DealLifecycleStatus.ACTIVE.name,
                dateReturned = null,
            ),
        )

        val repaired = repository.deals().single()

        assertEquals(DealLifecycleStatus.RETURNED, repaired.lifecycleStatus)
        assertEquals(deal.amountToReturn, repaired.paidOutAmount)
        assertEquals(emptyList(), repository.activeDeals())
    }

    @Test
    fun `deletes partner through dao with all related deals`() = runBlocking {
        val partnerDao = FakePartnerDao()
        val dealDao = FakeDealDao()
        val repository = RoomCrmRepository(partnerDao = partnerDao, dealDao = dealDao)
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 10.0)
        repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        repository.deletePartner(partner.id)

        assertEquals(emptyList(), repository.partners())
        assertEquals(emptyList(), repository.deals())
        assertEquals(0.0, repository.dashboard(today).totalAmountToReturn)
    }

    @Test
    fun `updates and deletes deal through dao`() = runBlocking {
        val partnerDao = FakePartnerDao()
        val dealDao = FakeDealDao()
        val repository = RoomCrmRepository(partnerDao = partnerDao, dealDao = dealDao)
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 10.0)
        val deal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        val updated = repository.updateDeal(
            id = deal.id,
            partnerId = partner.id,
            amountIn = 50_000.0,
            percent = 16.0,
            dateIn = today,
            dueDate = today.plusDays(3),
            comment = "changed",
        )
        repository.deleteDeal(updated.id)

        assertEquals(42_000.0, updated.amountToReturn)
        assertEquals(8_000.0, updated.profit)
        assertEquals(emptyList(), repository.deals())
    }

    @Test
    fun `stores notification settings through dao`() = runBlocking {
        val repository = RoomCrmRepository(
            partnerDao = FakePartnerDao(),
            dealDao = FakeDealDao(),
            settingsDao = FakeSettingsDao(),
        )
        val settings = AppSettings(
            remindersEnabled = false,
            remindThreeDaysBefore = true,
            remindOneDayBefore = false,
            remindOnDueDate = true,
            remindOverdueDaily = false,
            currencySymbol = "$",
        )

        repository.updateSettings(settings)

        assertEquals(settings, repository.settings())
    }

    private class FakePartnerDao : PartnerDao {
        private val partners = mutableListOf<PartnerEntity>()
        private var nextId = 1L

        override fun observeAll(): Flow<List<PartnerEntity>> = flowOf(partners)

        override suspend fun getAll(): List<PartnerEntity> = partners.sortedBy { it.name.lowercase() }

        override suspend fun getById(id: Long): PartnerEntity? = partners.firstOrNull { it.id == id }

        override suspend fun insert(partner: PartnerEntity): Long {
            val inserted = partner.copy(id = nextId++)
            partners += inserted
            return inserted.id
        }

        override suspend fun update(partner: PartnerEntity) {
            partners.replaceAll { if (it.id == partner.id) partner else it }
        }

        override suspend fun archive(id: Long, updatedAt: Long) {
            partners.replaceAll { if (it.id == id) it.copy(isActive = false, updatedAt = updatedAt) else it }
        }

        override suspend fun delete(id: Long) {
            partners.removeAll { it.id == id }
        }

        override suspend fun insertWithId(partner: PartnerEntity): Long {
            partners.removeAll { it.id == partner.id }
            partners += partner
            return partner.id
        }

        override suspend fun deleteAll() {
            partners.clear()
        }
    }

    private class FakeDealDao : DealDao {
        private val deals = mutableListOf<DealEntity>()
        private var nextId = 1L

        override fun observeAll(): Flow<List<DealEntity>> = flowOf(deals)

        override fun observeByPartner(partnerId: Long): Flow<List<DealEntity>> {
            return flowOf(deals.filter { it.partnerId == partnerId })
        }

        override suspend fun getAll(): List<DealEntity> = deals.sortedBy { it.dueDate }

        override suspend fun getById(id: Long): DealEntity? = deals.firstOrNull { it.id == id }

        override suspend fun insert(deal: DealEntity): Long {
            val inserted = deal.copy(id = nextId++)
            deals += inserted
            return inserted.id
        }

        override suspend fun update(deal: DealEntity) {
            deals.replaceAll { if (it.id == deal.id) deal else it }
        }

        override suspend fun delete(id: Long) {
            deals.removeAll { it.id == id }
        }

        override suspend fun deleteByPartner(partnerId: Long) {
            deals.removeAll { it.partnerId == partnerId }
        }

        override suspend fun insertWithId(deal: DealEntity): Long {
            deals.removeAll { it.id == deal.id }
            deals += deal
            return deal.id
        }

        override suspend fun deleteAll() {
            deals.clear()
        }
    }

    private class FakeSettingsDao : SettingsDao {
        private val values = mutableMapOf<String, AppSettingEntity>()
        private var nextId = 1L

        override fun observeAll(): Flow<List<AppSettingEntity>> = flowOf(values.values.toList())

        override suspend fun getValue(key: String): String? = values[key]?.value

        override suspend fun upsert(setting: AppSettingEntity) {
            val existing = values[setting.key]
            values[setting.key] = setting.copy(id = existing?.id ?: nextId++)
        }
    }
}
