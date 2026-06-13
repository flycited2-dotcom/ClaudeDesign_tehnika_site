package ru.partnercrm.domain.calculator

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
        val amountToReturn = when (calcType) {
            CalcType.DISCOUNT -> amountIn * (1 - percent / 100)
            CalcType.INTEREST -> amountIn * (1 + percent / 100)
        }
        return MoneyCalculation(
            amountToReturn = amountToReturn,
            profit = amountIn - amountToReturn,
        )
    }
}
