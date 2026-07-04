package ru.partnercrm.domain.calculator

import kotlin.test.Test
import kotlin.test.assertEquals

class MoneyCalculatorTest {
    @Test
    fun `calculates return amount and profit for eight percent discount`() {
        val result = MoneyCalculator.calculate(amountIn = 10_000.0, percent = 8.0)

        assertEquals(9_200.0, result.amountToReturn)
        assertEquals(800.0, result.profit)
    }

    @Test
    fun `calculates return amount and profit for ten percent discount`() {
        val result = MoneyCalculator.calculate(amountIn = 10_000.0, percent = 10.0)

        assertEquals(9_000.0, result.amountToReturn)
        assertEquals(1_000.0, result.profit)
    }

    @Test
    fun `calculates return amount and profit for twelve percent discount`() {
        val result = MoneyCalculator.calculate(amountIn = 100_000.0, percent = 12.0)

        assertEquals(88_000.0, result.amountToReturn)
        assertEquals(12_000.0, result.profit)
    }

    @Test
    fun `calculates return amount and profit for sixteen percent discount`() {
        val result = MoneyCalculator.calculate(amountIn = 500_000.0, percent = 16.0)

        assertEquals(420_000.0, result.amountToReturn)
        assertEquals(80_000.0, result.profit)
    }

    @Test
    fun `interest mode adds percent to the return amount`() {
        val result = MoneyCalculator.calculate(amountIn = 10_000.0, percent = 8.0, calcType = CalcType.INTEREST)

        assertEquals(10_800.0, result.amountToReturn)
        assertEquals(-800.0, result.profit)
    }

    @Test
    fun `rounds money values to whole rubles`() {
        val result = MoneyCalculator.calculate(amountIn = 492_544.60, percent = 10.0)

        assertEquals(443_290.0, result.amountToReturn)
        assertEquals(49_255.0, result.profit)
    }
}
