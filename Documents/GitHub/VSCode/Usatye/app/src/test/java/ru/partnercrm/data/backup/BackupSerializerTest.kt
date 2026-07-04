package ru.partnercrm.data.backup

import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import org.json.JSONObject
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.calculator.CalcType
import ru.partnercrm.domain.deal.DealLifecycleStatus

class BackupSerializerTest {
    @Test
    fun `exports and parses full backup round trip`() {
        val partner = Partner(
            id = 1,
            name = "Ivan",
            phone = "+70000000000",
            telegram = "@ivan",
            comment = "VIP",
            defaultPercent = 10.0,
            createdAt = 100,
            updatedAt = 200,
            isActive = true,
        )
        val deal = Deal(
            id = 2,
            partnerId = 1,
            amountIn = 100_000.0,
            percent = 10.0,
            amountToReturn = 90_000.0,
            profit = 10_000.0,
            paidOutAmount = 90_000.0,
            dateIn = LocalDate.of(2026, 6, 8),
            dueDate = LocalDate.of(2026, 6, 15),
            dateReturned = LocalDate.of(2026, 6, 14),
            lifecycleStatus = DealLifecycleStatus.RETURNED,
            comment = "Closed",
            createdAt = 300,
            updatedAt = 400,
        )
        val settings = AppSettings(
            remindersEnabled = false,
            remindThreeDaysBefore = false,
            remindOneDayBefore = true,
            remindOnDueDate = true,
            remindOverdueDaily = false,
            currencySymbol = "$",
            notifyTime = "10:30",
            hideAmounts = true,
            calcType = CalcType.INTEREST,
        )

        val parsed = BackupSerializer.parse(
            BackupSerializer.export(listOf(partner), listOf(deal), settings),
        )

        assertEquals(listOf(partner), parsed.partners)
        assertEquals(listOf(deal), parsed.deals)
        assertEquals(settings, parsed.settings)
    }

    @Test
    fun `rejects corrupted json`() {
        assertFailsWith<Exception> {
            BackupSerializer.parse("{not json")
        }
    }

    @Test
    fun `rejects backup without version`() {
        val backup = JSONObject(
            BackupSerializer.export(emptyList(), emptyList(), AppSettings()),
        )
        backup.remove("version")

        assertFailsWith<IllegalArgumentException> {
            BackupSerializer.parse(backup.toString())
        }
    }

    @Test
    fun `rejects unsupported backup version`() {
        val backup = JSONObject(
            BackupSerializer.export(emptyList(), emptyList(), AppSettings()),
        )
        backup.put("version", 999)

        assertFailsWith<IllegalArgumentException> {
            BackupSerializer.parse(backup.toString())
        }
    }
}
