package ru.partnercrm.domain.calculator

import kotlin.math.round

/** Тип расчёта возврата (ТЗ §27). */
enum class CalcType {
    /** Возврат за минусом процента: к возврату = сумма × (1 − %). */
    DISCOUNT,

    /** Возврат с начислением процента: к возврату = сумма × (1 + %). */
    INTEREST,
}

data class MoneyCalculation(
    val amountToReturn: Double,
    val profit: Double,
)

object MoneyCalculator {
    fun calculate(
        amountIn: Double,
        percent: Double,
        calcType: CalcType = CalcType.DISCOUNT,
    ): MoneyCalculation {
        val roundedAmountIn = roundMoney(amountIn)
        val amountToReturn = when (calcType) {
            CalcType.DISCOUNT -> roundedAmountIn * (1 - percent / 100)
            CalcType.INTEREST -> roundedAmountIn * (1 + percent / 100)
        }
        val roundedAmountToReturn = roundMoney(amountToReturn)
        return MoneyCalculation(
            amountToReturn = roundedAmountToReturn,
            profit = roundMoney(roundedAmountIn - roundedAmountToReturn),
        )
    }

    fun roundMoney(value: Double): Double = round(value)
}
