package ru.partnercrm.ui

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.Intents.intended
import androidx.test.espresso.intent.Intents.intending
import androidx.test.espresso.intent.matcher.IntentMatchers.hasAction
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.time.LocalDate
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.assertEquals
import org.junit.runner.RunWith
import ru.partnercrm.data.repository.InMemoryCrmRepository

@RunWith(AndroidJUnit4::class)
class PartnerMoneyAppInstrumentedTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun addDealDialogCreatesDealFromForm() {
        val repository = InMemoryCrmRepository()
        runBlocking {
            repository.createPartner(name = "Ivan", defaultPercent = 10.0)
        }
        composeRule.setContent {
            PartnerMoneyApp(repository = repository)
        }

        waitUntilNodeWithTag("add-deal-button")
        composeRule.onNodeWithTag("add-deal-button").performClick()
        composeRule.onNodeWithTag("deal-amount-field").performTextInput("100000")
        composeRule.onNodeWithTag("save-deal-button").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            runBlocking { repository.deals().isNotEmpty() }
        }
        val deal = runBlocking { repository.deals().single() }
        assertEquals(100_000.0, deal.amountIn, 0.0)
        assertEquals(90_000.0, deal.amountToReturn, 0.0)
    }

    @Test
    fun restoreBackupButtonLaunchesSystemFilePicker() {
        Intents.init()
        try {
            intending(hasAction(Intent.ACTION_OPEN_DOCUMENT)).respondWith(
                Instrumentation.ActivityResult(Activity.RESULT_CANCELED, null),
            )
            composeRule.setContent {
                PartnerMoneyApp(repository = InMemoryCrmRepository())
            }

            waitUntilNodeWithTag("tab-4")
            composeRule.onNodeWithTag("tab-4").performClick()
            waitUntilNodeWithTag("restore-backup-button")
            composeRule.onNodeWithTag("restore-backup-button").performClick()

            intended(hasAction(Intent.ACTION_OPEN_DOCUMENT))
        } finally {
            Intents.release()
        }
    }

    @Test
    fun tabsKeepBackNavigationHistory() {
        composeRule.setContent {
            PartnerMoneyApp(repository = InMemoryCrmRepository())
        }

        waitUntilNodeWithTag("tab-1")
        composeRule.onNodeWithTag("tab-1").performClick()
        composeRule.onNodeWithTag("tab-1").assertIsSelected()
        composeRule.onNodeWithTag("tab-2").performClick()
        composeRule.onNodeWithTag("tab-2").assertIsSelected()

        composeRule.runOnUiThread {
            composeRule.activity.onBackPressedDispatcher.onBackPressed()
        }

        composeRule.waitForIdle()
        composeRule.onNodeWithTag("tab-1").assertIsSelected()
    }

    private fun waitUntilNodeWithTag(tag: String) {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
        }
    }
}
