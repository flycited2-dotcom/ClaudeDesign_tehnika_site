package ru.partnercrm.export

import java.time.LocalDate
import java.util.zip.ZipInputStream
import kotlin.test.Test
import kotlin.test.assertTrue
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.deal.DealLifecycleStatus

class ExcelExporterTest {
    @Test
    fun `exports active deals xlsx with expected sheet content`() {
        val partner = Partner(
            id = 1,
            name = "Ivan",
            defaultPercent = 10.0,
            createdAt = 1,
            updatedAt = 1,
        )
        val deal = Deal(
            id = 2,
            partnerId = 1,
            amountIn = 100_000.0,
            percent = 10.0,
            amountToReturn = 90_000.0,
            profit = 10_000.0,
            dateIn = LocalDate.of(2026, 6, 8),
            dueDate = LocalDate.of(2026, 6, 15),
            lifecycleStatus = DealLifecycleStatus.ACTIVE,
            comment = "first",
            createdAt = 1,
            updatedAt = 1,
        )

        val bytes = ExcelExporter.activeDeals(partners = listOf(partner), deals = listOf(deal))
        val sheetXml = readZipEntry(bytes, "xl/worksheets/sheet1.xml")

        assertTrue(sheetXml.contains("Ivan"))
        assertTrue(sheetXml.contains("100000"))
        assertTrue(sheetXml.contains("90000"))
        assertTrue(sheetXml.contains("first"))
    }

    private fun readZipEntry(bytes: ByteArray, entryName: String): String {
        ZipInputStream(bytes.inputStream()).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                if (entry.name == entryName) {
                    return zip.readBytes().decodeToString()
                }
            }
        }
        error("Entry not found: $entryName")
    }
}
