package ru.partnercrm.export

import java.io.ByteArrayOutputStream
import java.time.LocalDate
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.data.model.expectedProfit
import ru.partnercrm.data.model.realizedProfit
import ru.partnercrm.data.model.remainingToReturn
import ru.partnercrm.domain.report.PeriodReportCalculator

object ExcelExporter {
    fun activeDeals(partners: List<Partner>, deals: List<Deal>): ByteArray {
        val partnersById = partners.associateBy { it.id }
        val rows = buildList {
            add(
                listOf(
                    "Партнёр",
                    "Телефон",
                    "Дата поступления",
                    "Сумма поступления",
                    "Процент",
                    "Сумма к возврату всего",
                    "Выдано",
                    "Осталось к возврату",
                    "Профит",
                    "Срок возврата",
                    "Статус",
                    "Комментарий",
                ),
            )
            deals.forEach { deal ->
                val partner = partnersById[deal.partnerId]
                add(
                    listOf(
                        partner?.name.orEmpty(),
                        partner?.phone.orEmpty(),
                        deal.dateIn.toString(),
                        deal.amountIn.toPlainCell(),
                        deal.percent.toPlainCell(),
                        deal.amountToReturn.toPlainCell(),
                        deal.paidOutAmount.toPlainCell(),
                        deal.remainingToReturn().toPlainCell(),
                        deal.expectedProfit().toPlainCell(),
                        deal.dueDate.toString(),
                        deal.lifecycleStatus.name,
                        deal.comment.orEmpty(),
                    ),
                )
            }
        }
        return workbook(rows)
    }

    fun weeklySummary(partners: List<Partner>, deals: List<Deal>, today: LocalDate): ByteArray {
        val weekEnd = today.plusDays(7)
        val partnersById = partners.associateBy { it.id }
        val rows = mutableListOf(
            listOf("Партнёр", "Всего зашло", "Всего к возврату", "Выдано", "Профит", "Активных сделок", "Ближайший срок", "Просрочено"),
        )
        deals.groupBy { it.partnerId }.forEach { (partnerId, partnerDeals) ->
            val activeDeals = partnerDeals.filter { it.dateReturned == null }
            rows += listOf(
                partnersById[partnerId]?.name.orEmpty(),
                activeDeals.sumOf { it.amountIn }.toPlainCell(),
                activeDeals.sumOf { it.remainingToReturn() }.toPlainCell(),
                partnerDeals.sumOf { it.paidOutAmount }.toPlainCell(),
                activeDeals.sumOf { it.expectedProfit() }.toPlainCell(),
                activeDeals.size.toString(),
                activeDeals.minOfOrNull { it.dueDate }?.toString().orEmpty(),
                activeDeals.count { it.dueDate.isBefore(today) }.toString(),
            )
        }
        rows += listOf("Период", today.toString(), weekEnd.toString(), "", "", "", "")
        return workbook(rows)
    }

    fun monthlySummary(partners: List<Partner>, deals: List<Deal>, month: Int, year: Int): ByteArray {
        val partnersById = partners.associateBy { it.id }
        val rows = mutableListOf(
            listOf("Месяц", "Партнёр", "Сумма поступления", "Сумма возврата", "Выдано", "Профит", "Дата поступления", "Дата возврата", "Статус"),
        )
        deals
            .filter { it.dateIn.monthValue == month && it.dateIn.year == year }
            .forEach { deal ->
                rows += listOf(
                    "%02d.%d".format(month, year),
                    partnersById[deal.partnerId]?.name.orEmpty(),
                    deal.amountIn.toPlainCell(),
                    deal.amountToReturn.toPlainCell(),
                    deal.paidOutAmount.toPlainCell(),
                    deal.displayProfit().toPlainCell(),
                    deal.dateIn.toString(),
                    deal.dateReturned?.toString().orEmpty(),
                    deal.lifecycleStatus.name,
                )
            }
        return workbook(rows)
    }

    /** Отчёт за произвольный период: сводка + разбивка по партнёрам + сделки периода. */
    fun periodReport(partners: List<Partner>, deals: List<Deal>, start: LocalDate, end: LocalDate): ByteArray {
        val report = PeriodReportCalculator.calculate(partners, deals, start, end)
        val partnersById = partners.associateBy { it.id }
        val rows = mutableListOf(
            listOf("Отчёт за период", "$start — $end"),
            listOf("Зашло за период", report.amountIn.toPlainCell()),
            listOf("Возвращено за период", report.returnedAmount.toPlainCell()),
            listOf("Заработано (реализовано)", report.realizedProfit.toPlainCell()),
            listOf("Ожидаемый профит", report.expectedProfit.toPlainCell()),
            listOf("Остаток к возврату", report.outstandingToReturn.toPlainCell()),
            listOf("Сделок открыто", report.dealsOpened.toString()),
            listOf("Сделок закрыто", report.dealsClosed.toString()),
            listOf(""),
            listOf("Партнёр", "Зашло", "Возвращено", "Заработано", "Сделок открыто"),
        )
        report.partners.forEach { line ->
            rows += listOf(
                line.partnerName,
                line.amountIn.toPlainCell(),
                line.returnedAmount.toPlainCell(),
                line.realizedProfit.toPlainCell(),
                line.dealsOpened.toString(),
            )
        }
        rows += listOf("")
        rows += listOf("Партнёр", "Дата поступления", "Сумма", "Процент", "К возврату", "Выдано", "Осталось", "Профит", "Срок", "Дата возврата", "Статус")
        deals
            .filter { !it.dateIn.isBefore(start) && !it.dateIn.isAfter(end) }
            .sortedBy { it.dateIn }
            .forEach { deal ->
                rows += listOf(
                    partnersById[deal.partnerId]?.name.orEmpty(),
                    deal.dateIn.toString(),
                    deal.amountIn.toPlainCell(),
                    deal.percent.toPlainCell(),
                    deal.amountToReturn.toPlainCell(),
                    deal.paidOutAmount.toPlainCell(),
                    deal.remainingToReturn().toPlainCell(),
                    deal.displayProfit().toPlainCell(),
                    deal.dueDate.toString(),
                    deal.dateReturned?.toString().orEmpty(),
                    deal.lifecycleStatus.name,
                )
            }
        return workbook(rows)
    }

    private fun workbook(rows: List<List<String>>): ByteArray {
        val output = ByteArrayOutputStream()
        ZipOutputStream(output).use { zip ->
            zip.textEntry("[Content_Types].xml", contentTypesXml())
            zip.textEntry("_rels/.rels", relsXml())
            zip.textEntry("xl/workbook.xml", workbookXml())
            zip.textEntry("xl/_rels/workbook.xml.rels", workbookRelsXml())
            zip.textEntry("xl/worksheets/sheet1.xml", sheetXml(rows))
        }
        return output.toByteArray()
    }

    private fun ZipOutputStream.textEntry(name: String, content: String) {
        putNextEntry(ZipEntry(name))
        write(content.toByteArray(Charsets.UTF_8))
        closeEntry()
    }

    private fun contentTypesXml() =
        """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>"""

    private fun relsXml() =
        """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""

    private fun workbookXml() =
        """<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets>
</workbook>"""

    private fun workbookRelsXml() =
        """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>"""

    private fun sheetXml(rows: List<List<String>>): String {
        val rowsXml = rows.mapIndexed { rowIndex, row ->
            val cells = row.mapIndexed { columnIndex, value ->
                val ref = "${columnName(columnIndex)}${rowIndex + 1}"
                """<c r="$ref" t="inlineStr"><is><t>${value.xmlEscape()}</t></is></c>"""
            }.joinToString("")
            """<row r="${rowIndex + 1}">$cells</row>"""
        }.joinToString("")
        return """<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>$rowsXml</sheetData>
</worksheet>"""
    }

    private fun columnName(index: Int): String {
        var value = index
        var name = ""
        do {
            name = ('A' + (value % 26)).toString() + name
            value = value / 26 - 1
        } while (value >= 0)
        return name
    }

    private fun String.xmlEscape(): String {
        return replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;")
    }

    private fun Double.toPlainCell(): String {
        return if (this % 1.0 == 0.0) toLong().toString() else toString()
    }

    private fun Deal.displayProfit(): Double = realizedProfit() + expectedProfit()
}
