package ru.partnercrm.data.repository

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlinx.coroutines.runBlocking
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.domain.deal.DealLifecycleStatus

class InMemoryCrmRepositoryTest {
    private val today = LocalDate.of(2026, 6, 8)

    @Test
    fun `creates deal with partner default percent and calculated money fields`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)

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
    fun `closes deal and removes it from active dashboard obligations`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)
        val deal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        repository.closeDeal(deal.id, payoutAmount = deal.amountToReturn, returnedAt = today.plusDays(2))

        val dashboard = repository.dashboard(today)
        assertEquals(0.0, dashboard.totalAmountIn)
        assertEquals(0.0, dashboard.totalAmountToReturn)
        assertEquals(0.0, dashboard.totalProfit)
        // Профит закрытой сделки не исчезает — он переходит в «Заработано».
        assertEquals(10_000.0, dashboard.realizedProfit)
        assertEquals(1, dashboard.closedDealsCount)
        assertEquals(DealLifecycleStatus.RETURNED, repository.deals().single().lifecycleStatus)
    }

    @Test
    fun `payout closes oldest partner deals and keeps partially paid deal active`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 0.0)
        val first = repository.createDeal(
            partnerId = partner.id,
            amountIn = 120_000.0,
            dateIn = today.minusDays(3),
            dueDate = today.plusDays(7),
        )
        val second = repository.createDeal(
            partnerId = partner.id,
            amountIn = 380_000.0,
            dateIn = today.minusDays(2),
            dueDate = today.plusDays(8),
        )
        val third = repository.createDeal(
            partnerId = partner.id,
            amountIn = 1_000_000.0,
            dateIn = today.minusDays(1),
            dueDate = today.plusDays(9),
        )

        repository.closeDeal(third.id, payoutAmount = 600_000.0, returnedAt = today)

        val deals = repository.deals()
        assertEquals(120_000.0, deals.single { it.id == first.id }.paidOutAmount)
        assertEquals(DealLifecycleStatus.RETURNED, deals.single { it.id == first.id }.lifecycleStatus)
        assertEquals(380_000.0, deals.single { it.id == second.id }.paidOutAmount)
        assertEquals(DealLifecycleStatus.RETURNED, deals.single { it.id == second.id }.lifecycleStatus)
        assertEquals(100_000.0, deals.single { it.id == third.id }.paidOutAmount)
        assertEquals(DealLifecycleStatus.ACTIVE, deals.single { it.id == third.id }.lifecycleStatus)
    }

    @Test
    fun `records payout by partner without selecting a concrete deal`() = runBlocking {
        val repository = InMemoryCrmRepository()
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
        assertEquals(100_000.0, deals.single { it.id == second.id }.amountToReturn - deals.single { it.id == second.id }.paidOutAmount)
        assertEquals(DealLifecycleStatus.ACTIVE, deals.single { it.id == second.id }.lifecycleStatus)
    }

    @Test
    fun `cancels deal and excludes it from active and realized totals`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)
        val deal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        repository.cancelDeal(deal.id)

        val dashboard = repository.dashboard(today)
        assertEquals(DealLifecycleStatus.CANCELLED, repository.deals().single().lifecycleStatus)
        assertEquals(0.0, dashboard.totalProfit)
        assertEquals(0.0, dashboard.realizedProfit)
        assertEquals(emptyList(), repository.activeDeals())
    }

    @Test
    fun `replaceAll restores partners deals and settings`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)
        repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        val snapshotPartners = repository.partners()
        val snapshotDeals = repository.deals()
        val snapshotSettings = repository.settings().copy(currencySymbol = "$")

        val fresh = InMemoryCrmRepository()
        fresh.replaceAll(snapshotPartners, snapshotDeals, snapshotSettings)

        assertEquals(snapshotPartners, fresh.partners())
        assertEquals(snapshotDeals, fresh.deals())
        assertEquals("$", fresh.settings().currencySymbol)
        // Новые id продолжают последовательность, без коллизий.
        val newDeal = fresh.createDeal(
            partnerId = partner.id,
            amountIn = 1_000.0,
            dateIn = today,
            dueDate = today.plusDays(1),
        )
        assertEquals(2L, newDeal.id)
    }

    @Test
    fun `active deals excludes returned deals and sorts by nearest due date`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 10.0)
        val laterDeal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(10),
        )
        val nearestDeal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 50_000.0,
            dateIn = today,
            dueDate = today.plusDays(2),
        )

        repository.closeDeal(laterDeal.id, payoutAmount = laterDeal.amountToReturn, returnedAt = today.plusDays(1))

        val activeDeals = repository.activeDeals()

        assertEquals(listOf(nearestDeal.id), activeDeals.map { it.id })
    }

    @Test
    fun `archives partner without deleting its deals`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)
        repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        repository.archivePartner(partner.id)

        assertEquals(false, repository.partners().single().isActive)
        assertEquals(1, repository.deals().size)
    }

    @Test
    fun `deletes partner with all deals and removes them from dashboard`() = runBlocking {
        val repository = InMemoryCrmRepository()
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
        val dashboard = repository.dashboard(today)
        assertEquals(0.0, dashboard.totalAmountIn)
        assertEquals(0.0, dashboard.totalAmountToReturn)
        assertEquals(0, dashboard.closedDealsCount)
    }

    @Test
    fun `updates partner fields`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 10.0)

        val updated = repository.updatePartner(
            id = partner.id,
            name = "Ivan Petrov",
            defaultPercent = 12.0,
            phone = "+70000000000",
            telegram = "@ivan",
            comment = "weekly",
            isActive = true,
        )

        assertEquals("Ivan Petrov", updated.name)
        assertEquals(12.0, updated.defaultPercent)
        assertEquals("+70000000000", updated.phone)
        assertEquals("@ivan", updated.telegram)
        assertEquals("weekly", updated.comment)
    }

    @Test
    fun `updates deal and recalculates money fields`() = runBlocking {
        val repository = InMemoryCrmRepository()
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

        assertEquals(50_000.0, updated.amountIn)
        assertEquals(16.0, updated.percent)
        assertEquals(42_000.0, updated.amountToReturn)
        assertEquals(8_000.0, updated.profit)
        assertEquals("changed", updated.comment)
    }

    @Test
    fun `deletes deal`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Ivan", defaultPercent = 10.0)
        val deal = repository.createDeal(
            partnerId = partner.id,
            amountIn = 100_000.0,
            dateIn = today,
            dueDate = today.plusDays(7),
        )

        repository.deleteDeal(deal.id)

        assertEquals(emptyList(), repository.deals())
    }

    @Test
    fun `stores notification settings`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val settings = AppSettings(
            remindersEnabled = false,
            remindThreeDaysBefore = false,
            remindOneDayBefore = true,
            remindOnDueDate = true,
            remindOverdueDaily = false,
            currencySymbol = "$",
        )

        repository.updateSettings(settings)

        assertEquals(settings, repository.settings())
    }

    @Test
    fun `rejects partner with blank name`() = runBlocking {
        val repository = InMemoryCrmRepository()

        assertFailsWith<IllegalArgumentException> {
            repository.createPartner(name = "   ", defaultPercent = 10.0)
        }
        Unit
    }

    @Test
    fun `rejects partner percent outside zero to one hundred range`() = runBlocking {
        val repository = InMemoryCrmRepository()

        assertFailsWith<IllegalArgumentException> {
            repository.createPartner(name = "Иван", defaultPercent = -1.0)
        }
        assertFailsWith<IllegalArgumentException> {
            repository.createPartner(name = "Иван", defaultPercent = 101.0)
        }
        Unit
    }

    @Test
    fun `rejects deal with non positive amount`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)

        assertFailsWith<IllegalArgumentException> {
            repository.createDeal(
                partnerId = partner.id,
                amountIn = 0.0,
                dateIn = today,
                dueDate = today.plusDays(7),
            )
        }
        Unit
    }

    @Test
    fun `rejects deal percent outside zero to one hundred range`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)

        assertFailsWith<IllegalArgumentException> {
            repository.createDeal(
                partnerId = partner.id,
                amountIn = 100_000.0,
                percent = 101.0,
                dateIn = today,
                dueDate = today.plusDays(7),
            )
        }
        Unit
    }

    @Test
    fun `rejects deal due date before incoming date`() = runBlocking {
        val repository = InMemoryCrmRepository()
        val partner = repository.createPartner(name = "Иван", defaultPercent = 10.0)

        assertFailsWith<IllegalArgumentException> {
            repository.createDeal(
                partnerId = partner.id,
                amountIn = 100_000.0,
                dateIn = today,
                dueDate = today.minusDays(1),
            )
        }
        Unit
    }
}
