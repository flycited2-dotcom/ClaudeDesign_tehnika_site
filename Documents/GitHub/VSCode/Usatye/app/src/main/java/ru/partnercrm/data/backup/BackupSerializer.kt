package ru.partnercrm.data.backup

import java.time.LocalDate
import org.json.JSONArray
import org.json.JSONObject
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.calculator.CalcType
import ru.partnercrm.domain.deal.DealLifecycleStatus

data class BackupData(
    val partners: List<Partner>,
    val deals: List<Deal>,
    val settings: AppSettings,
)

/** Простой JSON-бэкап всех данных (ТЗ §19). Даты хранятся как epoch day. */
object BackupSerializer {
    private const val VERSION = 1

    fun export(partners: List<Partner>, deals: List<Deal>, settings: AppSettings): String {
        val root = JSONObject()
        root.put("version", VERSION)

        val partnersJson = JSONArray()
        partners.forEach { partner ->
            partnersJson.put(
                JSONObject().apply {
                    put("id", partner.id)
                    put("name", partner.name)
                    put("phone", partner.phone ?: JSONObject.NULL)
                    put("telegram", partner.telegram ?: JSONObject.NULL)
                    put("comment", partner.comment ?: JSONObject.NULL)
                    put("defaultPercent", partner.defaultPercent)
                    put("createdAt", partner.createdAt)
                    put("updatedAt", partner.updatedAt)
                    put("isActive", partner.isActive)
                },
            )
        }
        root.put("partners", partnersJson)

        val dealsJson = JSONArray()
        deals.forEach { deal ->
            dealsJson.put(
                JSONObject().apply {
                    put("id", deal.id)
                    put("partnerId", deal.partnerId)
                    put("amountIn", deal.amountIn)
                    put("percent", deal.percent)
                    put("amountToReturn", deal.amountToReturn)
                    put("profit", deal.profit)
                    put("dateIn", deal.dateIn.toEpochDay())
                    put("dueDate", deal.dueDate.toEpochDay())
                    put("dateReturned", deal.dateReturned?.toEpochDay() ?: JSONObject.NULL)
                    put("status", deal.lifecycleStatus.name)
                    put("comment", deal.comment ?: JSONObject.NULL)
                    put("createdAt", deal.createdAt)
                    put("updatedAt", deal.updatedAt)
                },
            )
        }
        root.put("deals", dealsJson)

        root.put(
            "settings",
            JSONObject().apply {
                put("remindersEnabled", settings.remindersEnabled)
                put("remindThreeDaysBefore", settings.remindThreeDaysBefore)
                put("remindOneDayBefore", settings.remindOneDayBefore)
                put("remindOnDueDate", settings.remindOnDueDate)
                put("remindOverdueDaily", settings.remindOverdueDaily)
                put("currencySymbol", settings.currencySymbol)
                put("notifyTime", settings.notifyTime)
                put("hideAmounts", settings.hideAmounts)
                put("calcType", settings.calcType.name)
            },
        )
        return root.toString(2)
    }

    fun parse(json: String): BackupData {
        val root = JSONObject(json)

        val partnersJson = root.getJSONArray("partners")
        val partners = (0 until partnersJson.length()).map { index ->
            val obj = partnersJson.getJSONObject(index)
            Partner(
                id = obj.getLong("id"),
                name = obj.getString("name"),
                phone = obj.stringOrNull("phone"),
                telegram = obj.stringOrNull("telegram"),
                comment = obj.stringOrNull("comment"),
                defaultPercent = obj.getDouble("defaultPercent"),
                createdAt = obj.getLong("createdAt"),
                updatedAt = obj.getLong("updatedAt"),
                isActive = obj.optBoolean("isActive", true),
            )
        }

        val dealsJson = root.getJSONArray("deals")
        val deals = (0 until dealsJson.length()).map { index ->
            val obj = dealsJson.getJSONObject(index)
            Deal(
                id = obj.getLong("id"),
                partnerId = obj.getLong("partnerId"),
                amountIn = obj.getDouble("amountIn"),
                percent = obj.getDouble("percent"),
                amountToReturn = obj.getDouble("amountToReturn"),
                profit = obj.getDouble("profit"),
                dateIn = LocalDate.ofEpochDay(obj.getLong("dateIn")),
                dueDate = LocalDate.ofEpochDay(obj.getLong("dueDate")),
                dateReturned = if (obj.isNull("dateReturned")) null else LocalDate.ofEpochDay(obj.getLong("dateReturned")),
                lifecycleStatus = DealLifecycleStatus.valueOf(obj.getString("status")),
                comment = obj.stringOrNull("comment"),
                createdAt = obj.getLong("createdAt"),
                updatedAt = obj.getLong("updatedAt"),
            )
        }

        val settingsJson = root.optJSONObject("settings") ?: JSONObject()
        val settings = AppSettings(
            remindersEnabled = settingsJson.optBoolean("remindersEnabled", true),
            remindThreeDaysBefore = settingsJson.optBoolean("remindThreeDaysBefore", true),
            remindOneDayBefore = settingsJson.optBoolean("remindOneDayBefore", true),
            remindOnDueDate = settingsJson.optBoolean("remindOnDueDate", true),
            remindOverdueDaily = settingsJson.optBoolean("remindOverdueDaily", true),
            currencySymbol = settingsJson.optString("currencySymbol", "₽"),
            notifyTime = settingsJson.optString("notifyTime", "09:00"),
            hideAmounts = settingsJson.optBoolean("hideAmounts", false),
            calcType = runCatching { CalcType.valueOf(settingsJson.optString("calcType", "DISCOUNT")) }
                .getOrDefault(CalcType.DISCOUNT),
        )

        return BackupData(partners = partners, deals = deals, settings = settings)
    }

    private fun JSONObject.stringOrNull(key: String): String? =
        if (isNull(key)) null else optString(key, "").ifBlank { null }
}
