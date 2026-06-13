package ru.partnercrm.domain.report

import java.time.LocalDate
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.deal.DealLifecycleStatus

enum class ReportPeriodType {
    MONTH,
    QUARTER,
    YEAR,
}

/**
 * Выбранный период отчёта. [anchor] — любая дата внутри периода; границы вычисляются от неё.
 * Навигация [previous]/[next] сдвигает период на месяц/квартал/год.
 */
data class PeriodSelection(
    val type: ReportPeriodType,
    val anchor: LocalDate,
) {
    val start: LocalDate
        get() = when (type) {
            ReportPeriodType.MONTH -> anchor.withDayOfMonth(1)
            ReportPeriodType.QUARTER -> {
                val firstMonthOfQuarter = ((anchor.monthValue - 1) / 3) * 3 + 1
                anchor.withMonth(firstMonthOfQuarter).withDayOfMonth(1)
            }
            ReportPeriodType.YEAR -> anchor.withDayOfYear(1)
        }

    val end: LocalDate
        get() = when (type) {
            ReportPeriodType.MONTH -> start.plusMonths(1).minusDays(1)
            ReportPeriodType.QUARTER -> start.plusMonths(3).minusDays(1)
            ReportPeriodType.YEAR -> start.plusYears(1).minusDays(1)
        }

    fun previous(): PeriodSelection = shift(-1)

    fun next(): PeriodSelection = shift(1)

    private fun shift(direction: Int): PeriodSelection {
        val newAnchor = when (type) {
            ReportPeriodType.MONTH -> start.plusMonths(direction.toLong())
            ReportPeriodType.QUARTER -> start.plusMonths(3L * direction)
            ReportPeriodType.YEAR -> start.plusYears(direction.toLong())
        }
        return copy(anchor = newAnchor)
    }

    fun label(): String = when (type) {
        ReportPeriodType.MONTH -> "${monthName(start.monthValue)} ${start.year}"
        ReportPeriodType.QUARTER -> "${romanQuarter((start.monthValue - 1) / 3 + 1)} квартал ${start.year}"
        ReportPeriodType.YEAR -> "${start.year}"
    }

    companion object {
        private val MONTHS = listOf(
            "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
        )

        fun monthName(month: Int): String = MONTHS.getOrElse(month - 1) { month.toString() }

        private fun romanQuarter(quarter: Int): String = when (quarter) {
            1 -> "I"
            2 -> "II"
            3 -> "III"
            else -> "IV"
        }
    }
}

data class PartnerPeriodLine(
    val partnerId: Long,
    val partnerName: String,
    val amountIn: Double,
    val returnedAmount: Double,
    val realizedProfit: Double,
    val dealsOpened: Int,
)

data class PeriodReport(
    val start: LocalDate,
    val end: LocalDate,
    val amountIn: Double,
    val returnedAmount: Double,
    val realizedProfit: Double,
    val expectedProfit: Double,
    val outstandingToReturn: Double,
    val dealsOpened: Int,
    val dealsClosed: Int,
    val partners: List<PartnerPeriodLine>,
)

object PeriodReportCalculator {
    fun calculate(
        partners: List<Partner>,
        deals: List<Deal>,
        start: LocalDate,
        end: LocalDate,
    ): PeriodReport {
        val names = partners.associate { it.id to it.name }
        fun inRange(date: LocalDate?): Boolean =
            date != null && !date.isBefore(start) && !date.isAfter(end)

        val openedInPeriod = deals.filter { inRange(it.dateIn) }
        val closedInPeriod = deals.filter {
            it.lifecycleStatus == DealLifecycleStatus.RETURNED && inRange(it.dateReturned)
        }
        val activeOpenedInPeriod = openedInPeriod.filter {
            it.lifecycleStatus == DealLifecycleStatus.ACTIVE
        }

        val partnerIds = (openedInPeriod.map { it.partnerId } + closedInPeriod.map { it.partnerId }).distinct()
        val lines = partnerIds.map { partnerId ->
            val opened = openedInPeriod.filter { it.partnerId == partnerId }
            val closed = closedInPeriod.filter { it.partnerId == partnerId }
            PartnerPeriodLine(
                partnerId = partnerId,
                partnerName = names[partnerId] ?: "—",
                amountIn = opened.sumOf { it.amountIn },
                returnedAmount = closed.sumOf { it.amountToReturn },
                realizedProfit = closed.sumOf { it.profit },
                dealsOpened = opened.size,
            )
        }.sortedByDescending { it.realizedProfit + it.amountIn }

        return PeriodReport(
            start = start,
            end = end,
            amountIn = openedInPeriod.sumOf { it.amountIn },
            returnedAmount = closedInPeriod.sumOf { it.amountToReturn },
            realizedProfit = closedInPeriod.sumOf { it.profit },
            expectedProfit = activeOpenedInPeriod.sumOf { it.profit },
            outstandingToReturn = activeOpenedInPeriod.sumOf { it.amountToReturn },
            dealsOpened = openedInPeriod.size,
            dealsClosed = closedInPeriod.size,
            partners = lines,
        )
    }
}
