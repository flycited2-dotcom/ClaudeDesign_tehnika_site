package ru.partnercrm.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.core.content.FileProvider
import java.io.File
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.DecimalFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import kotlinx.coroutines.launch
import ru.partnercrm.R
import ru.partnercrm.data.model.AppSettings
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.data.model.expectedProfit
import ru.partnercrm.data.model.realizedProfit
import ru.partnercrm.data.model.remainingToReturn
import ru.partnercrm.data.backup.BackupSerializer
import ru.partnercrm.data.repository.CrmRepository
import ru.partnercrm.domain.calculator.CalcType
import ru.partnercrm.domain.calculator.MoneyCalculator
import ru.partnercrm.domain.dashboard.DashboardSummary
import ru.partnercrm.domain.dashboard.PartnerDashboardSummary
import ru.partnercrm.domain.dashboard.DashboardBreakdownCalculator
import ru.partnercrm.domain.dashboard.DashboardBreakdownType
import ru.partnercrm.domain.dashboard.DashboardCalculator
import ru.partnercrm.domain.deal.DealDisplayStatus
import ru.partnercrm.domain.deal.DealDefaults
import ru.partnercrm.domain.deal.DealListFilter
import ru.partnercrm.domain.deal.DealLifecycleStatus
import ru.partnercrm.domain.deal.DealStatusResolver
import ru.partnercrm.domain.deal.applyTo
import ru.partnercrm.domain.deal.sortedForIncomingTimeline
import ru.partnercrm.domain.payment.PaymentAllocationPreview
import ru.partnercrm.domain.report.PeriodReportCalculator
import ru.partnercrm.domain.report.PeriodSelection
import ru.partnercrm.domain.report.ReportPeriodType
import ru.partnercrm.export.ExcelExporter
import ru.partnercrm.share.DealShareTextFormatter

private val AppColors = lightColorScheme(
    primary = Color(0xFF1E6B5C),
    secondary = Color(0xFF315C82),
    tertiary = Color(0xFF8A5A14),
    background = Color(0xFFF7F8FA),
    surface = Color.White,
    error = Color(0xFFB42318),
)

private val MoneyFormat = DecimalFormat("#,##0")

// Обновляются в PartnerMoneyApp из настроек, чтобы money() единообразно учитывал валюту и скрытие сумм.
private var moneyCurrencySymbol: String = "₽"
private var moneyHideAmounts: Boolean = false

private data class BottomNavItem(
    val title: String,
    val iconRes: Int,
)

private data class AppSnapshot(
    val partners: List<Partner> = emptyList(),
    val deals: List<Deal> = emptyList(),
    val activeDeals: List<Deal> = emptyList(),
    val dashboard: DashboardSummary = DashboardCalculator.calculate(emptyList(), LocalDate.now()),
    val settings: AppSettings = AppSettings(),
)

@Composable
fun PartnerMoneyApp(
    repository: CrmRepository,
    onDataChanged: () -> Unit = {},
) {
    MaterialTheme(colorScheme = AppColors) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background,
        ) {
            var selectedTab by remember { mutableIntStateOf(0) }
            var version by remember { mutableIntStateOf(0) }
            var showPartnerDialog by remember { mutableStateOf(false) }
            var showDealDialog by remember { mutableStateOf(false) }
            var showPayoutDialog by remember { mutableStateOf(false) }
            var editingPartner by remember { mutableStateOf<Partner?>(null) }
            var editingDeal by remember { mutableStateOf<Deal?>(null) }
            var cancellingDeal by remember { mutableStateOf<Deal?>(null) }
            var deletingDeal by remember { mutableStateOf<Deal?>(null) }
            var deletingPartner by remember { mutableStateOf<Partner?>(null) }
            var dashboardBreakdownType by remember { mutableStateOf<DashboardBreakdownType?>(null) }
            var errorMessage by remember { mutableStateOf<String?>(null) }
            var infoMessage by remember { mutableStateOf<String?>(null) }
            var detailPartnerId by remember { mutableStateOf<Long?>(null) }
            var preselectedPartnerForDeal by remember { mutableStateOf<Long?>(null) }
            var preselectedPartnerForPayout by remember { mutableStateOf<Long?>(null) }
            val tabHistory = remember { mutableStateListOf<Int>() }
            val today = LocalDate.now()
            val context = LocalContext.current
            val scope = rememberCoroutineScope()
            var snapshot by remember { mutableStateOf(AppSnapshot()) }
            val partners = snapshot.partners
            val deals = snapshot.deals
            val activeDeals = snapshot.activeDeals
            val dashboard = snapshot.dashboard
            val settings = snapshot.settings
            moneyCurrencySymbol = settings.currencySymbol
            moneyHideAmounts = settings.hideAmounts
            val tabs = listOf(
                BottomNavItem("Дашборд", R.drawable.ic_nav_dashboard),
                BottomNavItem("Партнёры", R.drawable.ic_nav_partners),
                BottomNavItem("Сделки", R.drawable.ic_nav_deals),
                BottomNavItem("Отчёты", R.drawable.ic_nav_reports),
                BottomNavItem("Настройки", R.drawable.ic_nav_settings),
            )

            fun refresh() {
                version += 1
            }

            fun runMutation(
                onSuccess: () -> Unit = {},
                onFailure: (Throwable) -> Unit = { errorMessage = it.message },
                action: suspend () -> Unit,
            ) {
                scope.launch {
                    runCatching { action() }
                        .onSuccess {
                            onDataChanged()
                            onSuccess()
                            refresh()
                        }
                        .onFailure(onFailure)
                }
            }

            LaunchedEffect(version) {
                runCatching {
                    AppSnapshot(
                        partners = repository.partners(),
                        deals = repository.deals(),
                        activeDeals = repository.activeDeals(),
                        dashboard = repository.dashboard(today),
                        settings = repository.settings(),
                    )
                }
                    .onSuccess { snapshot = it }
                    .onFailure { errorMessage = it.message }
            }

            fun navigateToTab(index: Int) {
                if (selectedTab != index) {
                    tabHistory.add(selectedTab)
                    selectedTab = index
                }
                detailPartnerId = null
                dashboardBreakdownType = null
            }

            BackHandler(
                enabled = showPartnerDialog ||
                    showDealDialog ||
                    showPayoutDialog ||
                    editingPartner != null ||
                    editingDeal != null ||
                    cancellingDeal != null ||
                    deletingDeal != null ||
                    deletingPartner != null ||
                    dashboardBreakdownType != null ||
                    detailPartnerId != null ||
                    tabHistory.isNotEmpty() ||
                    selectedTab != 0,
            ) {
                when {
                    showPartnerDialog -> showPartnerDialog = false
                    showDealDialog -> {
                        showDealDialog = false
                        preselectedPartnerForDeal = null
                    }
                    showPayoutDialog -> {
                        showPayoutDialog = false
                        preselectedPartnerForPayout = null
                    }
                    editingPartner != null -> editingPartner = null
                    editingDeal != null -> editingDeal = null
                    cancellingDeal != null -> cancellingDeal = null
                    deletingDeal != null -> deletingDeal = null
                    deletingPartner != null -> deletingPartner = null
                    dashboardBreakdownType != null -> dashboardBreakdownType = null
                    detailPartnerId != null -> detailPartnerId = null
                    tabHistory.isNotEmpty() -> selectedTab = tabHistory.removeAt(tabHistory.lastIndex)
                    selectedTab != 0 -> selectedTab = 0
                }
            }

            Scaffold(
                bottomBar = {
                    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                        tabs.forEachIndexed { index, item ->
                            NavigationBarItem(
                                modifier = Modifier.testTag("tab-$index"),
                                selected = selectedTab == index,
                                onClick = { navigateToTab(index) },
                                icon = {
                                    Icon(
                                        painter = painterResource(item.iconRes),
                                        contentDescription = item.title,
                                    )
                                },
                                label = {
                                    Text(
                                        text = item.title,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        fontSize = 11.sp,
                                    )
                                },
                            )
                        }
                    }
                },
            ) { padding ->
                dashboardBreakdownType?.let { type ->
                    DashboardBreakdownScreen(
                        type = type,
                        partners = partners,
                        deals = deals,
                        today = today,
                        onBack = { dashboardBreakdownType = null },
                        onOpenPartner = { partnerId ->
                            dashboardBreakdownType = null
                            detailPartnerId = partnerId
                        },
                        contentPadding = padding,
                    )
                    return@Scaffold
                }
                val detailPartner = detailPartnerId?.let { id -> partners.firstOrNull { it.id == id } }
                if (detailPartner != null) {
                    PartnerDetailScreen(
                        partner = detailPartner,
                        summary = dashboard.partners.firstOrNull { it.partnerId == detailPartner.id },
                        deals = deals.filter { it.partnerId == detailPartner.id },
                        onBack = { detailPartnerId = null },
                        onEditPartner = { editingPartner = it },
                        onDeletePartner = { deletingPartner = it },
                        onArchive = { partnerId ->
                            runMutation { repository.archivePartner(partnerId) }
                        },
                        onAddDeal = {
                            preselectedPartnerForDeal = detailPartner.id
                            showDealDialog = true
                        },
                        onCall = { phone -> dialPhone(context, phone) { errorMessage = it } },
                        onTelegram = { telegram -> openTelegram(context, telegram) { errorMessage = it } },
                        onEditDeal = { editingDeal = it },
                        onDeleteDeal = { deletingDeal = it },
                        onShareDeal = { deal, partnerName ->
                            shareText(
                                context = context,
                                text = DealShareTextFormatter.format(partnerName, deal, settings.currencySymbol),
                                onError = { errorMessage = it },
                            )
                        },
                        onCloseDeal = {
                            preselectedPartnerForPayout = it.partnerId
                            showPayoutDialog = true
                        },
                        onCancelDeal = { cancellingDeal = it },
                        contentPadding = padding,
                    )
                    return@Scaffold
                }
                when (selectedTab) {
                    0 -> DashboardScreen(
                        dashboard = dashboard,
                        activeDeals = activeDeals,
                        onAddPartner = { showPartnerDialog = true },
                        onAddDeal = { showDealDialog = true },
                        onAddPayout = {
                            preselectedPartnerForPayout = null
                            showPayoutDialog = true
                        },
                        onOpenDeals = { navigateToTab(2) },
                        onOpenBreakdown = { dashboardBreakdownType = it },
                        onOpenPartner = { partnerId -> detailPartnerId = partnerId },
                        contentPadding = padding,
                    )

                    1 -> PartnersScreen(
                        partners = partners,
                        dashboard = dashboard,
                        onAddPartner = { showPartnerDialog = true },
                        onEditPartner = { editingPartner = it },
                        onDeletePartner = { deletingPartner = it },
                        onOpenPartner = { partnerId -> detailPartnerId = partnerId },
                        onArchive = { partnerId ->
                            runMutation { repository.archivePartner(partnerId) }
                        },
                        contentPadding = padding,
                    )

                    2 -> DealsScreen(
                        deals = deals,
                        partners = partners,
                        onAddDeal = { showDealDialog = true },
                        onEditDeal = { editingDeal = it },
                        onDeleteDeal = { deletingDeal = it },
                        onShareDeal = { deal, partnerName ->
                            shareText(
                                context = context,
                                text = DealShareTextFormatter.format(partnerName, deal, settings.currencySymbol),
                                onError = { errorMessage = it },
                            )
                        },
                        onCloseDeal = {
                            preselectedPartnerForPayout = it.partnerId
                            showPayoutDialog = true
                        },
                        onCancelDeal = { cancellingDeal = it },
                        contentPadding = padding,
                    )

                    3 -> ReportsScreen(
                        dashboard = dashboard,
                        partners = partners,
                        deals = deals,
                        context = context,
                        onError = { errorMessage = it },
                        contentPadding = padding,
                    )
                    else -> SettingsScreen(
                        settings = settings,
                        onSettingsChanged = { updated ->
                            runMutation { repository.updateSettings(updated) }
                        },
                        onExportBackup = {
                            scope.launch {
                                runCatching {
                                    val json = BackupSerializer.export(
                                        repository.partners(),
                                        repository.deals(),
                                        repository.settings(),
                                    )
                                    exportAndShare(
                                        context = context,
                                        fileName = "partner_money_backup.json",
                                        bytes = json.toByteArray(Charsets.UTF_8),
                                        onError = { errorMessage = it },
                                        mime = "application/json",
                                    )
                                }.onFailure { errorMessage = it.message }
                            }
                        },
                        onRestoreBackup = { json ->
                            runMutation(
                                onSuccess = { infoMessage = "Данные восстановлены из копии." },
                                onFailure = { errorMessage = "Не удалось восстановить: ${it.message}" },
                            ) {
                                val data = BackupSerializer.parse(json)
                                repository.replaceAll(data.partners, data.deals, data.settings)
                            }
                        },
                        contentPadding = padding,
                    )
                }
            }

            if (showPartnerDialog) {
                AddPartnerDialog(
                    partner = null,
                    onDismiss = { showPartnerDialog = false },
                    onSave = { name, percent, phone, telegram, comment, isActive ->
                        runMutation(
                            onSuccess = { showPartnerDialog = false },
                        ) {
                            repository.createPartner(
                                name = name,
                                defaultPercent = percent,
                                phone = phone,
                                telegram = telegram,
                                comment = comment,
                            )
                        }
                    },
                )
            }

            editingPartner?.let { partner ->
                AddPartnerDialog(
                    partner = partner,
                    onDismiss = { editingPartner = null },
                    onSave = { name, percent, phone, telegram, comment, isActive ->
                        runMutation(
                            onSuccess = { editingPartner = null },
                        ) {
                            repository.updatePartner(
                                id = partner.id,
                                name = name,
                                defaultPercent = percent,
                                phone = phone,
                                telegram = telegram,
                                comment = comment,
                                isActive = isActive,
                            )
                        }
                    },
                )
            }

            if (showDealDialog) {
                AddDealDialog(
                    partners = partners.filter { it.isActive },
                    deal = null,
                    calcType = settings.calcType,
                    preselectedPartnerId = preselectedPartnerForDeal,
                    onDismiss = {
                        showDealDialog = false
                        preselectedPartnerForDeal = null
                    },
                    onSave = { partnerId, amount, percent, dateIn, dueDate, comment ->
                        runMutation(
                            onSuccess = {
                                showDealDialog = false
                                preselectedPartnerForDeal = null
                            },
                        ) {
                            repository.createDeal(
                                partnerId = partnerId,
                                amountIn = amount,
                                percent = percent,
                                dateIn = dateIn,
                                dueDate = dueDate,
                                comment = comment,
                            )
                        }
                    },
                )
            }

            editingDeal?.let { deal ->
                AddDealDialog(
                    partners = partners.filter { it.isActive || it.id == deal.partnerId },
                    deal = deal,
                    calcType = settings.calcType,
                    onDismiss = { editingDeal = null },
                    onSave = { partnerId, amount, percent, dateIn, dueDate, comment ->
                        val dealPercent = percent ?: partners.firstOrNull { it.id == partnerId }?.defaultPercent
                        if (dealPercent == null) {
                            errorMessage = "Партнёр не найден"
                        } else {
                            runMutation(
                                onSuccess = { editingDeal = null },
                            ) {
                                repository.updateDeal(
                                    id = deal.id,
                                    partnerId = partnerId,
                                    amountIn = amount,
                                    percent = dealPercent,
                                    dateIn = dateIn,
                                    dueDate = dueDate,
                                    comment = comment,
                                )
                            }
                        }
                    },
                )
            }

            if (showPayoutDialog) {
                AddPayoutDialog(
                    partners = partners,
                    deals = deals,
                    preselectedPartnerId = preselectedPartnerForPayout,
                    onDismiss = {
                        showPayoutDialog = false
                        preselectedPartnerForPayout = null
                    },
                    onSave = { partnerId, payoutAmount, paidAt ->
                        runMutation(
                            onSuccess = {
                                showPayoutDialog = false
                                preselectedPartnerForPayout = null
                                infoMessage = "Выдача записана: ${money(payoutAmount)}"
                            },
                        ) { repository.recordPayout(partnerId, payoutAmount, paidAt) }
                    },
                )
            }

            deletingDeal?.let { deal ->
                AlertDialog(
                    onDismissRequest = { deletingDeal = null },
                    title = { Text("Удалить сделку?") },
                    text = { Text("Это действие нельзя отменить.") },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                runMutation(
                                    onSuccess = {
                                        deletingDeal = null
                                    },
                                ) { repository.deleteDeal(deal.id) }
                            },
                        ) {
                            Text("Удалить")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { deletingDeal = null }) {
                            Text("Отмена")
                        }
                    },
                )
            }

            deletingPartner?.let { partner ->
                AlertDialog(
                    onDismissRequest = { deletingPartner = null },
                    title = { Text("Удалить партнёра?") },
                    text = {
                        Text(
                            "Партнёр «${partner.name}» будет удалён полностью.\n" +
                                "Все его сделки и история по нему тоже будут стёрты. Это действие нельзя отменить.",
                        )
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                runMutation(
                                    onSuccess = {
                                        if (detailPartnerId == partner.id) {
                                            detailPartnerId = null
                                        }
                                        deletingPartner = null
                                    },
                                ) { repository.deletePartner(partner.id) }
                            },
                        ) {
                            Text("Удалить")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { deletingPartner = null }) {
                            Text("Отмена")
                        }
                    },
                )
            }

            cancellingDeal?.let { deal ->
                val partnerName = partners.firstOrNull { it.id == deal.partnerId }?.name ?: "Партнёр"
                AlertDialog(
                    onDismissRequest = { cancellingDeal = null },
                    title = { Text("Отменить сделку?") },
                    text = {
                        Text(
                            "Сделка станет отменённой и перестанет учитываться в обязательствах.\n" +
                                "Партнёр: $partnerName",
                        )
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                runMutation(
                                    onSuccess = {
                                        cancellingDeal = null
                                    },
                                ) { repository.cancelDeal(deal.id) }
                            },
                        ) {
                            Text("Отменить сделку")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { cancellingDeal = null }) {
                            Text("Назад")
                        }
                    },
                )
            }

            errorMessage?.let { message ->
                AlertDialog(
                    onDismissRequest = { errorMessage = null },
                    title = { Text("Ошибка") },
                    text = { Text(message) },
                    confirmButton = {
                        TextButton(onClick = { errorMessage = null }) {
                            Text("Ок")
                        }
                    },
                )
            }

            infoMessage?.let { message ->
                AlertDialog(
                    onDismissRequest = { infoMessage = null },
                    title = { Text("Готово") },
                    text = { Text(message) },
                    confirmButton = {
                        TextButton(onClick = { infoMessage = null }) {
                            Text("Ок")
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun DashboardScreen(
    dashboard: DashboardSummary,
    activeDeals: List<Deal>,
    onAddPartner: () -> Unit,
    onAddDeal: () -> Unit,
    onAddPayout: () -> Unit,
    onOpenDeals: () -> Unit,
    onOpenBreakdown: (DashboardBreakdownType) -> Unit,
    onOpenPartner: (Long) -> Unit,
    contentPadding: PaddingValues,
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { ScreenTitle("Дашборд") }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Заработано",
                    value = money(dashboard.realizedProfit),
                    accent = Color(0xFF1E6B5C),
                    onClick = { onOpenBreakdown(DashboardBreakdownType.EARNED) },
                )
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Ожидается",
                    value = money(dashboard.expectedProfit),
                    accent = Color(0xFF8A5A14),
                    onClick = { onOpenBreakdown(DashboardBreakdownType.EXPECTED) },
                )
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Всего зашло",
                    value = money(dashboard.totalAmountIn),
                    accent = Color(0xFF315C82),
                    onClick = { onOpenBreakdown(DashboardBreakdownType.INCOMING) },
                )
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "К возврату",
                    value = money(dashboard.totalAmountToReturn),
                    accent = Color(0xFF315C82),
                    onClick = { onOpenBreakdown(DashboardBreakdownType.TO_RETURN) },
                )
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Просрочено",
                    value = "${dashboard.overdueDealsCount} / ${money(dashboard.overdueAmount)}",
                    accent = Color(0xFFB42318),
                    onClick = { onOpenBreakdown(DashboardBreakdownType.OVERDUE) },
                )
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Выдано",
                    value = money(dashboard.totalPaidOutAmount),
                    accent = Color(0xFF6A4BBC),
                    onClick = { onOpenBreakdown(DashboardBreakdownType.PAID_OUT) },
                )
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Активных сделок",
                    value = activeDeals.size.toString(),
                    accent = Color(0xFF18212F),
                    onClick = onOpenDeals,
                )
                MetricCard(Modifier.weight(1f), "Закрыто сделок", dashboard.closedDealsCount.toString(), Color(0xFF667085))
            }
        }
        item {
            ActionRow(onAddDeal = onAddDeal, onAddPayout = onAddPayout, onAddPartner = onAddPartner)
        }
        if (dashboard.partners.isEmpty()) {
            item {
                SectionPanel("Партнёры", "Добавьте первого партнёра, затем внесите сделку.")
            }
        } else {
            items(dashboard.partners.size) { index ->
                val partner = dashboard.partners[index]
                SectionPanel(
                    title = partner.partnerName,
                    body = "Зашло (активные): ${money(partner.totalAmountIn)}\nК возврату: ${money(partner.totalAmountToReturn)}\nВыдано: ${money(partner.totalPaidOutAmount)}\nОжидается профит: ${money(partner.totalProfit)}\nЗаработано (закрыто): ${money(partner.realizedProfit)}\nАктивных сделок: ${partner.activeDealsCount} • Закрыто: ${partner.closedDealsCount}\nБлижайший срок: ${partner.nearestDueDate ?: "-"}",
                    onClick = { onOpenPartner(partner.partnerId) },
                )
            }
        }
    }
}

@Composable
private fun DashboardBreakdownScreen(
    type: DashboardBreakdownType,
    partners: List<Partner>,
    deals: List<Deal>,
    today: LocalDate,
    onBack: () -> Unit,
    onOpenPartner: (Long) -> Unit,
    contentPadding: PaddingValues,
) {
    val breakdown = DashboardBreakdownCalculator.calculate(type, partners, deals, today)
    val accent = when (type) {
        DashboardBreakdownType.EARNED -> Color(0xFF1E6B5C)
        DashboardBreakdownType.EXPECTED -> Color(0xFF8A5A14)
        DashboardBreakdownType.INCOMING,
        DashboardBreakdownType.TO_RETURN,
        -> Color(0xFF315C82)

        DashboardBreakdownType.OVERDUE -> Color(0xFFB42318)
        DashboardBreakdownType.PAID_OUT -> Color(0xFF6A4BBC)
    }
    val dealsLabel = if (type == DashboardBreakdownType.OVERDUE) "Просроченных сделок" else "Сделок"

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onBack) { Text("← Назад") }
                ScreenTitle("${type.title} по партнёрам", modifier = Modifier.weight(1f))
            }
        }
        item {
            Column(modifier = panelModifier(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Всего", color = Color(0xFF667085))
                Text(
                    money(breakdown.totalAmount),
                    color = accent,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth()) {
                Text("Партнёр", modifier = Modifier.weight(1f), color = Color(0xFF667085), fontSize = 13.sp)
                Text("Сумма", color = Color(0xFF667085), fontSize = 13.sp)
            }
        }
        if (breakdown.lines.isEmpty()) {
            item { SectionPanel("Нет данных", "По этому показателю сделок пока нет.") }
        } else {
            items(breakdown.lines.size) { index ->
                val line = breakdown.lines[index]
                Row(
                    modifier = panelModifier().clickable { onOpenPartner(line.partnerId) },
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(line.partnerName, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                        Text("$dealsLabel: ${line.dealsCount}", color = Color(0xFF667085), fontSize = 13.sp)
                    }
                    Text(line.amount.let(::money), color = accent, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun PartnersScreen(
    partners: List<Partner>,
    dashboard: DashboardSummary,
    onAddPartner: () -> Unit,
    onEditPartner: (Partner) -> Unit,
    onDeletePartner: (Partner) -> Unit,
    onOpenPartner: (Long) -> Unit,
    onArchive: (Long) -> Unit,
    contentPadding: PaddingValues,
) {
    var query by remember { mutableStateOf("") }
    var showArchived by remember { mutableStateOf(false) }
    val normalizedQuery = query.trim().lowercase()
    val visiblePartners = partners.filter { partner ->
        val matchesQuery = normalizedQuery.isEmpty() ||
            partner.name.lowercase().contains(normalizedQuery) ||
            partner.phone.orEmpty().lowercase().contains(normalizedQuery) ||
            partner.telegram.orEmpty().lowercase().contains(normalizedQuery)
        matchesQuery && (showArchived || partner.isActive)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ScreenTitle("Партнёры", modifier = Modifier.weight(1f))
                Button(onClick = onAddPartner, shape = RoundedCornerShape(8.dp)) {
                    Text("+")
                }
            }
        }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    label = { Text("Поиск") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = !showArchived,
                        onClick = { showArchived = false },
                        label = { Text("Активные") },
                    )
                    FilterChip(
                        selected = showArchived,
                        onClick = { showArchived = true },
                        label = { Text("Все") },
                    )
                }
            }
        }
        if (visiblePartners.isEmpty()) {
            item { SectionPanel("Нет партнёров", "Измените поиск или добавьте нового партнёра.") }
        } else {
            items(visiblePartners.size) { index ->
                val partner = visiblePartners[index]
                val summary = dashboard.partners.firstOrNull { it.partnerId == partner.id }
                PartnerCard(
                    partner = partner,
                    summaryText = summary?.let {
                        "Зашло: ${money(it.totalAmountIn)}\nК возврату: ${money(it.totalAmountToReturn)}\nВыдано: ${money(it.totalPaidOutAmount)}\nЗаработано: ${money(it.realizedProfit)}\nАктивных сделок: ${it.activeDealsCount} • Закрыто: ${it.closedDealsCount}"
                    } ?: "Сделок пока нет",
                    onOpen = onOpenPartner,
                    onEdit = onEditPartner,
                    onDelete = onDeletePartner,
                    onArchive = onArchive,
                )
            }
        }
    }
}

@Composable
private fun DealsScreen(
    deals: List<Deal>,
    partners: List<Partner>,
    onAddDeal: () -> Unit,
    onEditDeal: (Deal) -> Unit,
    onDeleteDeal: (Deal) -> Unit,
    onShareDeal: (Deal, String) -> Unit,
    onCloseDeal: (Deal) -> Unit,
    onCancelDeal: (Deal) -> Unit,
    contentPadding: PaddingValues,
) {
    var query by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf(DealListFilter.ACTIVE) }
    val today = LocalDate.now()
    val partnersById = partners.associateBy { it.id }
    val normalizedQuery = query.trim().lowercase()
    val visibleDeals = selectedFilter.applyTo(deals, today).filter { deal ->
        val partnerName = partnersById[deal.partnerId]?.name.orEmpty()
        normalizedQuery.isEmpty() ||
            partnerName.lowercase().contains(normalizedQuery) ||
            deal.comment.orEmpty().lowercase().contains(normalizedQuery)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ScreenTitle("Сделки", modifier = Modifier.weight(1f))
                Button(onClick = onAddDeal, enabled = partners.any { it.isActive }, shape = RoundedCornerShape(8.dp)) {
                    Text("+ Приход")
                }
            }
        }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    label = { Text("Поиск") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    DealListFilter.entries.forEach { filter ->
                        FilterChip(
                            selected = selectedFilter == filter,
                            onClick = { selectedFilter = filter },
                            label = { Text(dealFilterLabel(filter)) },
                        )
                    }
                }
            }
        }
        if (visibleDeals.isEmpty()) {
            item { SectionPanel("Нет сделок", "Измените фильтр или добавьте новую сделку.") }
        } else {
            items(visibleDeals.size) { index ->
                val deal = visibleDeals[index]
                val partnerName = partnersById[deal.partnerId]?.name ?: "Партнёр"
                DealCard(
                    deal = deal,
                    partnerName = partnerName,
                    onEditDeal = onEditDeal,
                    onDeleteDeal = onDeleteDeal,
                    onShareDeal = { onShareDeal(deal, partnerName) },
                    onCloseDeal = onCloseDeal,
                    onCancelDeal = onCancelDeal,
                )
            }
        }
    }
}

@Composable
private fun ReportsScreen(
    dashboard: DashboardSummary,
    partners: List<Partner>,
    deals: List<Deal>,
    context: Context,
    onError: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    var selection by remember { mutableStateOf(PeriodSelection(ReportPeriodType.MONTH, LocalDate.now())) }
    val report = remember(selection, deals, partners) {
        PeriodReportCalculator.calculate(partners, deals, selection.start, selection.end)
    }
    val periodOptions = listOf(
        ReportPeriodType.MONTH to "Месяц",
        ReportPeriodType.QUARTER to "Квартал",
        ReportPeriodType.YEAR to "Год",
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { ScreenTitle("Отчёты") }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    periodOptions.forEach { (type, label) ->
                        FilterChip(
                            selected = selection.type == type,
                            onClick = { selection = selection.copy(type = type) },
                            label = { Text(label) },
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    TextButton(onClick = { selection = selection.previous() }) { Text("◀ Назад") }
                    Text(selection.label(), fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                    TextButton(onClick = { selection = selection.next() }) { Text("Вперёд ▶") }
                }
            }
        }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("Сводка за период", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                Text("Зашло: ${money(report.amountIn)}", color = Color(0xFF344054))
                Text("Возвращено: ${money(report.returnedAmount)}", color = Color(0xFF344054))
                Text(
                    "Заработано: ${money(report.realizedProfit)}",
                    color = Color(0xFF1E6B5C),
                    fontWeight = FontWeight.SemiBold,
                )
                Text("Ожидается профит: ${money(report.expectedProfit)}", color = Color(0xFF344054))
                Text("Остаток к возврату: ${money(report.outstandingToReturn)}", color = Color(0xFF344054))
                Text(
                    "Сделок открыто: ${report.dealsOpened} • закрыто: ${report.dealsClosed}",
                    color = Color(0xFF667085),
                )
            }
        }
        if (selection.type == ReportPeriodType.YEAR) {
            item {
                Column(
                    modifier = panelModifier(),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text("Заработано по месяцам", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                    MonthBarsChart(monthlyRealizedProfit(deals, selection.start.year))
                    Text("Янв … Дек", fontSize = 12.sp, color = Color(0xFF98A2B3))
                }
            }
        }
        if (report.partners.isEmpty()) {
            item { SectionPanel("Нет данных за период", "Выберите другой период или добавьте сделки.") }
        } else {
            items(report.partners.size) { index ->
                val line = report.partners[index]
                SectionPanel(
                    title = line.partnerName,
                    body = "Зашло: ${money(line.amountIn)}\nВозвращено: ${money(line.returnedAmount)}\nЗаработано: ${money(line.realizedProfit)}\nСделок открыто: ${line.dealsOpened}",
                )
            }
        }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("Excel", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                Button(
                    onClick = {
                        exportAndShare(
                            context = context,
                            fileName = "report_${selection.start}_${selection.end}.xlsx",
                            bytes = ExcelExporter.periodReport(partners, deals, selection.start, selection.end),
                            onError = onError,
                        )
                    },
                    shape = RoundedCornerShape(8.dp),
                ) {
                    Text("Отчёт за период .xlsx")
                }
                Button(
                    onClick = {
                        exportAndShare(
                            context = context,
                            fileName = "active_deals.xlsx",
                            bytes = ExcelExporter.activeDeals(partners, deals.filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }),
                            onError = onError,
                        )
                    },
                    shape = RoundedCornerShape(8.dp),
                ) {
                    Text("Активные сделки .xlsx")
                }
            }
        }
    }
}

@Composable
private fun MonthBarsChart(values: List<Double>) {
    val maxValue = (values.maxOrNull() ?: 0.0).coerceAtLeast(1.0)
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp),
    ) {
        val count = values.size.coerceAtLeast(1)
        val gap = 6.dp.toPx()
        val barWidth = ((size.width - gap * (count - 1)) / count).coerceAtLeast(1f)
        values.forEachIndexed { index, value ->
            val barHeight = (value / maxValue * size.height).toFloat().coerceIn(0f, size.height)
            val left = index * (barWidth + gap)
            drawRect(
                color = Color(0xFF1E6B5C),
                topLeft = Offset(left, size.height - barHeight),
                size = Size(barWidth, barHeight),
            )
        }
    }
}

private fun monthlyRealizedProfit(deals: List<Deal>, year: Int): List<Double> {
    val totals = DoubleArray(12)
    deals
        .filter { it.lifecycleStatus == DealLifecycleStatus.RETURNED }
        .forEach { deal ->
            val returned = deal.dateReturned ?: return@forEach
            if (returned.year == year) {
                totals[returned.monthValue - 1] += deal.realizedProfit()
            }
        }
    return totals.toList()
}

@Composable
private fun SettingsScreen(
    settings: AppSettings,
    onSettingsChanged: (AppSettings) -> Unit,
    onExportBackup: () -> Unit,
    onRestoreBackup: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    val context = LocalContext.current
    var currencySymbol by remember(settings) { mutableStateOf(settings.currencySymbol) }
    var pendingRestoreJson by remember { mutableStateOf<String?>(null) }
    var restoreError by remember { mutableStateOf<String?>(null) }
    val importLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri: Uri? ->
        if (uri != null) {
            val text = runCatching {
                context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
            }.getOrNull()
            if (text.isNullOrBlank()) restoreError = "Не удалось прочитать файл" else pendingRestoreJson = text
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { ScreenTitle("Настройки") }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("Напоминания", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                SwitchSettingRow("Включены", settings.remindersEnabled) {
                    onSettingsChanged(settings.copy(remindersEnabled = it))
                }
                SwitchSettingRow("За 3 дня", settings.remindThreeDaysBefore, enabled = settings.remindersEnabled) {
                    onSettingsChanged(settings.copy(remindThreeDaysBefore = it))
                }
                SwitchSettingRow("За 1 день", settings.remindOneDayBefore, enabled = settings.remindersEnabled) {
                    onSettingsChanged(settings.copy(remindOneDayBefore = it))
                }
                SwitchSettingRow("В день срока", settings.remindOnDueDate, enabled = settings.remindersEnabled) {
                    onSettingsChanged(settings.copy(remindOnDueDate = it))
                }
                SwitchSettingRow("Просрочка каждый день", settings.remindOverdueDaily, enabled = settings.remindersEnabled) {
                    onSettingsChanged(settings.copy(remindOverdueDaily = it))
                }
                TimeField("Время напоминаний", settings.notifyTime, enabled = settings.remindersEnabled) {
                    onSettingsChanged(settings.copy(notifyTime = it))
                }
            }
        }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("Отображение", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                OutlinedTextField(
                    value = currencySymbol,
                    onValueChange = { currencySymbol = it.take(4) },
                    label = { Text("Символ валюты") },
                    modifier = Modifier.fillMaxWidth(),
                )
                TextButton(
                    onClick = {
                        onSettingsChanged(settings.copy(currencySymbol = currencySymbol.trim().ifBlank { "₽" }))
                    },
                ) {
                    Text("Сохранить валюту")
                }
                SwitchSettingRow("Скрывать суммы (•••)", settings.hideAmounts) {
                    onSettingsChanged(settings.copy(hideAmounts = it))
                }
            }
        }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("Тип расчёта", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = settings.calcType == CalcType.DISCOUNT,
                        onClick = { onSettingsChanged(settings.copy(calcType = CalcType.DISCOUNT)) },
                        label = { Text("Дисконт") },
                    )
                    FilterChip(
                        selected = settings.calcType == CalcType.INTEREST,
                        onClick = { onSettingsChanged(settings.copy(calcType = CalcType.INTEREST)) },
                        label = { Text("Наценка") },
                    )
                }
                Text(
                    text = if (settings.calcType == CalcType.DISCOUNT) {
                        "Дисконт: к возврату = сумма − %. Профит остаётся у вас."
                    } else {
                        "Наценка: к возврату = сумма + %. Вы возвращаете больше."
                    },
                    fontSize = 13.sp,
                    color = Color(0xFF667085),
                )
                Text("Применяется к новым сделкам.", fontSize = 12.sp, color = Color(0xFF98A2B3))
            }
        }
        item {
            Column(
                modifier = panelModifier(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("Резервная копия", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                Button(onClick = onExportBackup, shape = RoundedCornerShape(8.dp)) {
                    Text("Сохранить копию (.json)")
                }
                Button(
                    modifier = Modifier.testTag("restore-backup-button"),
                    onClick = { importLauncher.launch(arrayOf("application/json", "text/*", "*/*")) },
                    shape = RoundedCornerShape(8.dp),
                ) {
                    Text("Восстановить из файла")
                }
            }
        }
    }

    pendingRestoreJson?.let { json ->
        AlertDialog(
            onDismissRequest = { pendingRestoreJson = null },
            title = { Text("Восстановить данные?") },
            text = { Text("Текущие партнёры и сделки будут заменены данными из файла. Действие нельзя отменить.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onRestoreBackup(json)
                        pendingRestoreJson = null
                    },
                ) { Text("Восстановить") }
            },
            dismissButton = {
                TextButton(onClick = { pendingRestoreJson = null }) { Text("Отмена") }
            },
        )
    }

    restoreError?.let { message ->
        AlertDialog(
            onDismissRequest = { restoreError = null },
            title = { Text("Ошибка") },
            text = { Text(message) },
            confirmButton = { TextButton(onClick = { restoreError = null }) { Text("Ок") } },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TimeField(
    label: String,
    value: String,
    enabled: Boolean = true,
    onPick: (String) -> Unit,
) {
    var showPicker by remember { mutableStateOf(false) }
    OutlinedButton(
        onClick = { showPicker = true },
        enabled = enabled,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
    ) {
        Text("$label: $value")
    }
    if (showPicker) {
        val parts = value.split(":")
        val initialHour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 9
        val initialMinute = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 0
        val state = rememberTimePickerState(initialHour = initialHour, initialMinute = initialMinute, is24Hour = true)
        AlertDialog(
            onDismissRequest = { showPicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        onPick("%02d:%02d".format(state.hour, state.minute))
                        showPicker = false
                    },
                ) { Text("Ок") }
            },
            dismissButton = {
                TextButton(onClick = { showPicker = false }) { Text("Отмена") }
            },
            text = { TimePicker(state = state) },
        )
    }
}

@Composable
private fun PartnerDetailScreen(
    partner: Partner,
    summary: PartnerDashboardSummary?,
    deals: List<Deal>,
    onBack: () -> Unit,
    onEditPartner: (Partner) -> Unit,
    onDeletePartner: (Partner) -> Unit,
    onArchive: (Long) -> Unit,
    onAddDeal: () -> Unit,
    onCall: (String) -> Unit,
    onTelegram: (String) -> Unit,
    onEditDeal: (Deal) -> Unit,
    onDeleteDeal: (Deal) -> Unit,
    onShareDeal: (Deal, String) -> Unit,
    onCloseDeal: (Deal) -> Unit,
    onCancelDeal: (Deal) -> Unit,
    contentPadding: PaddingValues,
) {
    val today = LocalDate.now()
    val activeDeals = deals.filter { it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
    val closedDeals = deals.filter { it.lifecycleStatus == DealLifecycleStatus.RETURNED }
    val overdueCount = activeDeals.count {
        DealStatusResolver.resolve(it.lifecycleStatus, it.dueDate, today) == DealDisplayStatus.OVERDUE
    }
    val sortedDeals = deals.sortedForIncomingTimeline()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = onBack) { Text("← Назад") }
                ScreenTitle(partner.name, modifier = Modifier.weight(1f))
            }
        }
        item {
            Column(modifier = panelModifier(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Процент по умолчанию: ${formatNumber(partner.defaultPercent)}%", color = Color(0xFF667085))
                partner.phone?.takeIf { it.isNotBlank() }?.let { Text("Телефон: $it", color = Color(0xFF667085)) }
                partner.telegram?.takeIf { it.isNotBlank() }?.let { Text("Telegram: $it", color = Color(0xFF667085)) }
                partner.comment?.takeIf { it.isNotBlank() }?.let { Text(it, color = Color(0xFF667085)) }
                if (!partner.isActive) Text("Архивный", color = Color(0xFFB42318))
            }
        }
        item {
            Column(modifier = panelModifier(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Финансы", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
                Text("Зашло (активные): ${money(activeDeals.sumOf { it.amountIn })}", color = Color(0xFF344054))
                Text("К возврату: ${money(activeDeals.sumOf { it.remainingToReturn() })}", color = Color(0xFF344054))
                Text("Выдано: ${money(deals.sumOf { it.paidOutAmount })}", color = Color(0xFF344054))
                Text("Ожидается профит: ${money(activeDeals.sumOf { it.expectedProfit() })}", color = Color(0xFF344054))
                Text(
                    "Заработано (закрыто): ${money(closedDeals.sumOf { it.realizedProfit() })}",
                    color = Color(0xFF1E6B5C),
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    "Активных: ${activeDeals.size} • Закрыто: ${closedDeals.size} • Просрочено: $overdueCount",
                    color = Color(0xFF667085),
                )
                Text("Ближайший срок: ${summary?.nearestDueDate ?: activeDeals.minOfOrNull { it.dueDate } ?: "-"}", color = Color(0xFF667085))
            }
        }
        item {
            Column(modifier = panelModifier(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Button(onClick = onAddDeal, shape = RoundedCornerShape(8.dp)) {
                    Text("+ Приход")
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    partner.phone?.takeIf { it.isNotBlank() }?.let { phone ->
                        TextButton(onClick = { onCall(phone) }) { Text("Позвонить") }
                    }
                    partner.telegram?.takeIf { it.isNotBlank() }?.let { telegram ->
                        TextButton(onClick = { onTelegram(telegram) }) { Text("Telegram") }
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    TextButton(onClick = { onEditPartner(partner) }) { Text("Редактировать") }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    if (partner.isActive) {
                        TextButton(onClick = { onArchive(partner.id) }) { Text("В архив") }
                    }
                    TextButton(onClick = { onDeletePartner(partner) }) { Text("Удалить") }
                }
            }
        }
        item {
            Text("Сделки партнёра", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
        }
        if (sortedDeals.isEmpty()) {
            item { SectionPanel("Сделок нет", "Добавьте первую сделку этого партнёра.") }
        } else {
            items(sortedDeals.size) { index ->
                val deal = sortedDeals[index]
                DealCard(
                    deal = deal,
                    partnerName = partner.name,
                    onEditDeal = onEditDeal,
                    onDeleteDeal = onDeleteDeal,
                    onShareDeal = { onShareDeal(deal, partner.name) },
                    onCloseDeal = onCloseDeal,
                    onCancelDeal = onCancelDeal,
                )
            }
        }
    }
}

@Composable
private fun PartnerCard(
    partner: Partner,
    summaryText: String,
    onOpen: (Long) -> Unit,
    onEdit: (Partner) -> Unit,
    onDelete: (Partner) -> Unit,
    onArchive: (Long) -> Unit,
) {
    Column(
        modifier = panelModifier().clickable { onOpen(partner.id) },
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(partner.name, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
        Text("Процент по умолчанию: ${formatNumber(partner.defaultPercent)}%", color = Color(0xFF667085))
        partner.phone?.takeIf { it.isNotBlank() }?.let { Text("Телефон: $it", color = Color(0xFF667085)) }
        partner.telegram?.takeIf { it.isNotBlank() }?.let { Text("Telegram: $it", color = Color(0xFF667085)) }
        partner.comment?.takeIf { it.isNotBlank() }?.let { Text(it, color = Color(0xFF667085)) }
        Text(summaryText, color = Color(0xFF344054))
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            TextButton(onClick = { onOpen(partner.id) }) {
                Text("Открыть")
            }
            TextButton(onClick = { onEdit(partner) }) {
                Text("Редактировать")
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            if (partner.isActive) {
                TextButton(onClick = { onArchive(partner.id) }) {
                    Text("В архив")
                }
            }
            TextButton(onClick = { onDelete(partner) }) {
                Text("Удалить")
            }
        }
        if (!partner.isActive) {
            Text("Архивный", color = Color(0xFF667085))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddPayoutDialog(
    partners: List<Partner>,
    deals: List<Deal>,
    preselectedPartnerId: Long?,
    onDismiss: () -> Unit,
    onSave: (Long, Double, LocalDate) -> Unit,
) {
    val defaultPartnerId = preselectedPartnerId
        ?: partners.firstOrNull { partner ->
            deals.any {
                it.partnerId == partner.id &&
                    it.lifecycleStatus == DealLifecycleStatus.ACTIVE &&
                    it.remainingToReturn() > 0.0
            }
        }?.id
        ?: partners.firstOrNull()?.id
    var selectedPartnerId by remember(partners, deals, preselectedPartnerId) {
        mutableStateOf(defaultPartnerId)
    }
    var partnerMenuExpanded by remember { mutableStateOf(false) }
    var payoutText by remember { mutableStateOf("") }
    var paidAt by remember { mutableStateOf(LocalDate.now()) }
    var localError by remember { mutableStateOf<String?>(null) }
    val focusManager = LocalFocusManager.current
    val selectedPartner = partners.firstOrNull { it.id == selectedPartnerId }
    val activePartnerDeals = selectedPartnerId?.let { partnerId ->
        deals
            .filter { it.partnerId == partnerId && it.lifecycleStatus == DealLifecycleStatus.ACTIVE }
    } ?: emptyList()
    val remainingTotal = activePartnerDeals.sumOf { it.remainingToReturn() }
    val parsedPayout = payoutText.parseDecimalOrNull()
    val allocationPreview = if (parsedPayout != null && parsedPayout > 0.0) {
        PaymentAllocationPreview.preview(activePartnerDeals, parsedPayout)
    } else {
        emptyList()
    }

    fun submit() {
        focusManager.clearFocus()
        val partnerId = selectedPartnerId
        val parsed = payoutText.parseDecimalOrNull()
        when {
            partnerId == null -> localError = "Выберите партнёра"
            parsed == null -> localError = "Введите сумму числом"
            parsed <= 0.0 -> localError = "Сумма должна быть больше 0"
            remainingTotal <= 0.0 -> localError = "У партнёра нет активного долга"
            MoneyCalculator.roundMoney(parsed) > remainingTotal -> localError = "Сумма больше остатка"
            else -> onSave(partnerId, parsed, paidAt)
        }
    }

    LaunchedEffect(selectedPartnerId, remainingTotal) {
        payoutText = if (remainingTotal > 0.0) formatNumber(remainingTotal) else ""
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Сделка-выдача") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (partners.isEmpty()) {
                    Text("Сначала добавьте партнёра.")
                } else {
                    ExposedDropdownMenuBox(
                        expanded = partnerMenuExpanded,
                        onExpandedChange = { partnerMenuExpanded = it },
                    ) {
                        OutlinedTextField(
                            value = selectedPartner?.name ?: "Выберите партнёра",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Партнёр") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = partnerMenuExpanded)
                            },
                            modifier = Modifier
                                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable, true)
                                .fillMaxWidth(),
                        )
                        ExposedDropdownMenu(
                            expanded = partnerMenuExpanded,
                            onDismissRequest = { partnerMenuExpanded = false },
                        ) {
                            partners.forEach { partner ->
                                DropdownMenuItem(
                                    text = { Text(partner.name) },
                                    onClick = {
                                        selectedPartnerId = partner.id
                                        partnerMenuExpanded = false
                                    },
                                )
                            }
                        }
                    }
                    Text("Остаток к возврату: ${money(remainingTotal)}", color = Color(0xFF344054))
                    DateField("Дата выдачи", paidAt) { paidAt = it }
                }
                OutlinedTextField(
                    value = payoutText,
                    onValueChange = { payoutText = it },
                    label = { Text("Сумма выдачи") },
                    enabled = partners.isNotEmpty(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onPreviewKeyEvent {
                            if (it.key == Key.Enter && it.type == KeyEventType.KeyUp) {
                                submit()
                                true
                            } else {
                                false
                            }
                        },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Decimal,
                        imeAction = ImeAction.Done,
                    ),
                    keyboardActions = KeyboardActions(onDone = { submit() }),
                )
                if (allocationPreview.isNotEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFEFF4F2), RoundedCornerShape(8.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text("Подбор по дате прихода", color = Color(0xFF18212F), fontWeight = FontWeight.SemiBold)
                        allocationPreview.forEach { row ->
                            val status = if (row.willClose) "закроется" else "частично"
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    "Дата прихода ${row.deal.dateIn}: ${money(row.appliedAmount)} • $status",
                                    color = Color(0xFF344054),
                                    fontSize = 13.sp,
                                )
                                Text(
                                    "Остаток после расхода: ${money(row.remainingAfter)}",
                                    color = if (row.willClose) Color(0xFF1E6B5C) else Color(0xFF8A5A14),
                                    fontSize = 13.sp,
                                )
                            }
                        }
                    }
                }
                localError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            TextButton(
                modifier = Modifier.testTag("save-deal-button"),
                enabled = partners.isNotEmpty(),
                onClick = { submit() },
            ) {
                Text("Записать")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Отмена") }
        },
    )
}

@Composable
private fun DealCard(
    deal: Deal,
    partnerName: String,
    onEditDeal: (Deal) -> Unit,
    onDeleteDeal: (Deal) -> Unit,
    onShareDeal: () -> Unit,
    onCloseDeal: (Deal) -> Unit,
    onCancelDeal: (Deal) -> Unit,
) {
    val status = DealStatusResolver.resolve(
        storedStatus = deal.lifecycleStatus,
        dueDate = deal.dueDate,
        today = LocalDate.now(),
    )
    val isClosed = deal.lifecycleStatus == DealLifecycleStatus.RETURNED
    Column(
        modifier = panelModifier(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(partnerName, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
        Text("Сумма прихода: ${money(deal.amountIn)}", color = Color(0xFF344054))
        Text("К возврату партнёру: ${money(deal.amountToReturn)}", color = Color(0xFF344054))
        Text("Выдано: ${money(deal.paidOutAmount)}", color = Color(0xFF344054))
        if (deal.lifecycleStatus == DealLifecycleStatus.ACTIVE && deal.paidOutAmount > 0.0) {
            Text("Осталось: ${money(deal.remainingToReturn())}", color = Color(0xFF8A5A14))
        }
        Text(
            text = (if (isClosed) "Заработано" else "Ваш профит") +
                ": ${money(if (isClosed) deal.realizedProfit() else deal.expectedProfit())} (${deal.percent}%)",
            color = if (isClosed) Color(0xFF1E6B5C) else Color(0xFF344054),
            fontWeight = FontWeight.SemiBold,
        )
        Text("Дата поступления: ${deal.dateIn}", color = Color(0xFF667085))
        deal.dateReturned?.let { Text("Закрыта: $it", color = Color(0xFF667085)) }
        deal.comment?.takeIf { it.isNotBlank() }?.let { Text(it, color = Color(0xFF667085)) }
        Text("Срок: ${deal.dueDate} • ${statusLabel(status)}", color = statusColor(status))
        TextButton(onClick = { onEditDeal(deal) }) {
            Text("Редактировать")
        }
        TextButton(onClick = onShareDeal) {
            Text("Поделиться")
        }
        if (deal.lifecycleStatus == DealLifecycleStatus.ACTIVE) {
            Button(onClick = { onCloseDeal(deal) }, shape = RoundedCornerShape(8.dp)) {
                Text("Сделка-выдача")
            }
            TextButton(onClick = { onCancelDeal(deal) }) {
                Text("Отменить сделку")
            }
        }
        TextButton(onClick = { onDeleteDeal(deal) }) {
            Text("Удалить")
        }
    }
}

@Composable
private fun AddPartnerDialog(
    partner: Partner?,
    onDismiss: () -> Unit,
    onSave: (String, Double, String?, String?, String?, Boolean) -> Unit,
) {
    var name by remember(partner) { mutableStateOf(partner?.name ?: "") }
    var percent by remember(partner) { mutableStateOf(partner?.defaultPercent?.toString() ?: "10") }
    var phone by remember(partner) { mutableStateOf(partner?.phone ?: "") }
    var telegram by remember(partner) { mutableStateOf(partner?.telegram ?: "") }
    var comment by remember(partner) { mutableStateOf(partner?.comment ?: "") }
    var isActive by remember(partner) { mutableStateOf(partner?.isActive ?: true) }
    var localError by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (partner == null) "Новый партнёр" else "Редактировать партнёра") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Имя") })
                OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Телефон") })
                OutlinedTextField(value = telegram, onValueChange = { telegram = it }, label = { Text("Telegram") })
                OutlinedTextField(value = percent, onValueChange = { percent = it }, label = { Text("Процент") })
                OutlinedTextField(value = comment, onValueChange = { comment = it }, label = { Text("Комментарий") })
                if (partner != null) {
                    TextButton(onClick = { isActive = !isActive }) {
                        Text(if (isActive) "Статус: активный" else "Статус: архивный")
                    }
                }
                localError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val parsedPercent = percent.parseDecimalOrNull()
                    if (parsedPercent == null) {
                        localError = "Введите процент числом"
                    } else {
                        onSave(
                            name,
                            parsedPercent,
                            phone.takeIf { it.isNotBlank() },
                            telegram.takeIf { it.isNotBlank() },
                            comment.takeIf { it.isNotBlank() },
                            isActive,
                        )
                    }
                },
            ) {
                Text("Сохранить")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Отмена") }
        },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddDealDialog(
    partners: List<Partner>,
    deal: Deal?,
    onDismiss: () -> Unit,
    onSave: (Long, Double, Double?, LocalDate, LocalDate, String?) -> Unit,
    preselectedPartnerId: Long? = null,
    calcType: CalcType = CalcType.DISCOUNT,
) {
    var selectedPartnerId by remember(partners, deal) {
        mutableStateOf(deal?.partnerId ?: preselectedPartnerId ?: partners.firstOrNull()?.id)
    }
    var partnerMenuExpanded by remember { mutableStateOf(false) }
    var amount by remember(deal) { mutableStateOf(deal?.amountIn?.let { formatNumber(it) } ?: "") }
    var percent by remember(deal) { mutableStateOf(deal?.percent?.let { formatNumber(it) } ?: "") }
    var dateIn by remember(deal) { mutableStateOf(deal?.dateIn ?: LocalDate.now()) }
    var dueDate by remember(deal) { mutableStateOf(deal?.dueDate ?: DealDefaults.defaultDueDate(dateIn)) }
    var comment by remember(deal) { mutableStateOf(deal?.comment ?: "") }
    var localError by remember { mutableStateOf<String?>(null) }
    val focusManager = LocalFocusManager.current

    val selectedPartner = partners.firstOrNull { it.id == selectedPartnerId }

    // ТЗ 7.5: при выборе партнёра процент подставляется автоматически (только для новой сделки).
    LaunchedEffect(selectedPartnerId) {
        if (deal == null) {
            selectedPartner?.let { percent = formatNumber(it.defaultPercent) }
        }
    }

    val effectivePercent = percent.parseDecimalOrNull() ?: selectedPartner?.defaultPercent
    val parsedAmount = amount.parseDecimalOrNull()
    val preview = if (parsedAmount != null && parsedAmount > 0.0 && effectivePercent != null && effectivePercent in 0.0..100.0) {
        MoneyCalculator.calculate(parsedAmount, effectivePercent, calcType)
    } else {
        null
    }

    fun submit() {
        focusManager.clearFocus()
        val partnerId = selectedPartnerId
        val parsed = amount.parseDecimalOrNull()
        val parsedPercent = percent.takeIf { it.isNotBlank() }?.parseDecimalOrNull()
        when {
            partnerId == null -> localError = "Выберите партнёра"
            parsed == null -> localError = "Введите сумму числом"
            parsed <= 0.0 -> localError = "Сумма должна быть больше 0"
            percent.isNotBlank() && parsedPercent == null -> localError = "Введите процент числом"
            dueDate.isBefore(dateIn) -> localError = "Срок возврата не может быть раньше даты поступления"
            else -> onSave(
                partnerId,
                parsed,
                parsedPercent,
                dateIn,
                dueDate,
                comment.takeIf { it.isNotBlank() },
            )
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (deal == null) "Сделка-приход" else "Редактировать приход") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (partners.isEmpty()) {
                    Text("Сначала добавьте партнёра.")
                } else {
                    ExposedDropdownMenuBox(
                        expanded = partnerMenuExpanded,
                        onExpandedChange = { partnerMenuExpanded = it },
                    ) {
                        OutlinedTextField(
                            value = selectedPartner?.name ?: "Выберите партнёра",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Партнёр") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = partnerMenuExpanded)
                            },
                            modifier = Modifier
                                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable, true)
                                .fillMaxWidth(),
                        )
                        ExposedDropdownMenu(
                            expanded = partnerMenuExpanded,
                            onDismissRequest = { partnerMenuExpanded = false },
                        ) {
                            partners.forEach { partner ->
                                DropdownMenuItem(
                                    text = { Text("${partner.name} • ${formatNumber(partner.defaultPercent)}%") },
                                    onClick = {
                                        selectedPartnerId = partner.id
                                        partnerMenuExpanded = false
                                    },
                                )
                            }
                        }
                    }
                    OutlinedTextField(
                        value = amount,
                        onValueChange = { amount = it },
                        label = { Text("Сумма прихода") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("deal-amount-field")
                            .onPreviewKeyEvent {
                                if (it.key == Key.Enter && it.type == KeyEventType.KeyUp) {
                                    submit()
                                    true
                                } else {
                                    false
                                }
                            },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Decimal,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(onDone = { submit() }),
                    )
                    OutlinedTextField(
                        value = percent,
                        onValueChange = { percent = it },
                        label = { Text("Процент удержания, %") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .onPreviewKeyEvent {
                                if (it.key == Key.Enter && it.type == KeyEventType.KeyUp) {
                                    submit()
                                    true
                                } else {
                                    false
                                }
                            },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Decimal,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(onDone = { submit() }),
                    )
                    DateField("Дата поступления", dateIn) {
                        dateIn = it
                        if (deal == null) {
                            dueDate = DealDefaults.defaultDueDate(it)
                        }
                    }
                    DateField("Срок возврата", dueDate) { dueDate = it }
                    OutlinedTextField(
                        value = comment,
                        onValueChange = { comment = it },
                        label = { Text("Комментарий") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (preview != null) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFEFF4F2), RoundedCornerShape(8.dp))
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text("К возврату партнёру: ${money(preview.amountToReturn)}", color = Color(0xFF18212F))
                            Text(
                                "Ваш профит: ${money(preview.profit)}",
                                color = Color(0xFF1E6B5C),
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                    localError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                }
            }
        },
        confirmButton = {
            TextButton(
                enabled = partners.isNotEmpty(),
                onClick = { submit() },
            ) {
                Text("Сохранить")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Отмена") }
        },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateField(
    label: String,
    value: LocalDate,
    onPick: (LocalDate) -> Unit,
) {
    var showPicker by remember { mutableStateOf(false) }
    OutlinedButton(
        onClick = { showPicker = true },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
    ) {
        Text("$label: $value")
    }
    if (showPicker) {
        val state = rememberDatePickerState(initialSelectedDateMillis = value.toUtcMillis())
        DatePickerDialog(
            onDismissRequest = { showPicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        state.selectedDateMillis?.let { onPick(it.toLocalDateUtc()) }
                        showPicker = false
                    },
                ) { Text("Ок") }
            },
            dismissButton = {
                TextButton(onClick = { showPicker = false }) { Text("Отмена") }
            },
        ) {
            DatePicker(state = state)
        }
    }
}

@Composable
private fun ScreenTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        modifier = modifier,
        text = text,
        fontSize = 24.sp,
        fontWeight = FontWeight.SemiBold,
        color = Color(0xFF18212F),
    )
}

@Composable
private fun MetricCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    accent: Color,
    onClick: (() -> Unit)? = null,
) {
    val cardModifier = if (onClick == null) {
        modifier.height(108.dp)
    } else {
        modifier
            .height(108.dp)
            .clickable { onClick() }
    }

    Card(
        modifier = cardModifier,
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(title, color = Color(0xFF667085), maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 13.sp)
            Text(
                text = value,
                color = accent,
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Clip,
                fontSize = metricValueFontSize(value),
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

private fun metricValueFontSize(value: String) = when {
    value.length >= 18 -> 15.sp
    value.length >= 14 -> 17.sp
    value.length >= 11 -> 19.sp
    else -> 22.sp
}

@Composable
private fun ActionRow(onAddDeal: () -> Unit, onAddPayout: () -> Unit, onAddPartner: () -> Unit) {
    val actionButtonPadding = PaddingValues(horizontal = 8.dp, vertical = 12.dp)

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Button(
            modifier = Modifier
                .weight(1f)
                .testTag("add-deal-button"),
            onClick = onAddDeal,
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E6B5C)),
            contentPadding = actionButtonPadding,
        ) {
            Text(
                "Приход",
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Clip,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Button(
            modifier = Modifier.weight(1f),
            onClick = onAddPayout,
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6A4BBC)),
            contentPadding = actionButtonPadding,
        ) {
            Text(
                "Расход",
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Clip,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Button(
            modifier = Modifier.weight(1f),
            onClick = onAddPartner,
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF315C82)),
            contentPadding = actionButtonPadding,
        ) {
            Text(
                "Партнер",
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Clip,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun SectionPanel(title: String, body: String, onClick: (() -> Unit)? = null) {
    val modifier = if (onClick != null) panelModifier().clickable { onClick() } else panelModifier()
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(title, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF18212F))
        Text(body, fontSize = 14.sp, color = Color(0xFF667085))
    }
}

@Composable
private fun SwitchSettingRow(
    title: String,
    checked: Boolean,
    enabled: Boolean = true,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, color = if (enabled) Color(0xFF344054) else Color(0xFF98A2B3))
        Switch(
            checked = checked,
            enabled = enabled,
            onCheckedChange = onCheckedChange,
        )
    }
}

private fun panelModifier(): Modifier {
    return Modifier
        .fillMaxWidth()
        .background(
            color = Color.White,
            shape = RoundedCornerShape(8.dp),
        )
        .padding(16.dp)
}

private fun String.parseDecimalOrNull(): Double? {
    return trim()
        .replace(" ", "")
        .replace(",", ".")
        .toDoubleOrNull()
}

private fun formatNumber(value: Double): String {
    return if (value % 1.0 == 0.0) value.toLong().toString() else value.toString()
}

private fun LocalDate.toUtcMillis(): Long {
    return atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
}

private fun Long.toLocalDateUtc(): LocalDate {
    return Instant.ofEpochMilli(this).atZone(ZoneOffset.UTC).toLocalDate()
}

private fun exportAndShare(
    context: Context,
    fileName: String,
    bytes: ByteArray,
    onError: (String) -> Unit,
    mime: String = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
) {
    runCatching {
        val dir = File(context.cacheDir, "reports").apply { mkdirs() }
        val file = File(dir, fileName).apply { writeBytes(bytes) }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Поделиться файлом"))
    }.onFailure {
        onError(it.message ?: "Не удалось сформировать файл")
    }
}

private fun shareText(
    context: Context,
    text: String,
    onError: (String) -> Unit,
) {
    runCatching {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        context.startActivity(Intent.createChooser(intent, "Поделиться сделкой"))
    }.onFailure {
        onError(it.message ?: "Не удалось поделиться сделкой")
    }
}

private fun dialPhone(context: Context, phone: String, onError: (String) -> Unit) {
    runCatching {
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${phone.trim()}"))
        context.startActivity(intent)
    }.onFailure {
        onError(it.message ?: "Не удалось открыть набор номера")
    }
}

private fun openTelegram(context: Context, telegram: String, onError: (String) -> Unit) {
    val username = telegram.trim().removePrefix("@")
    runCatching {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://t.me/$username"))
        context.startActivity(intent)
    }.onFailure {
        onError(it.message ?: "Не удалось открыть Telegram")
    }
}

private fun money(value: Double): String {
    if (moneyHideAmounts) return "•••"
    return "${MoneyFormat.format(MoneyCalculator.roundMoney(value)).replace(',', ' ')} $moneyCurrencySymbol"
}

private fun dealFilterLabel(filter: DealListFilter): String {
    return when (filter) {
        DealListFilter.ACTIVE -> "Активные"
        DealListFilter.OVERDUE -> "Просрочка"
        DealListFilter.DUE_SOON -> "Скоро"
        DealListFilter.HISTORY -> "История"
        DealListFilter.ALL -> "Все"
    }
}

private fun statusLabel(status: DealDisplayStatus): String {
    return when (status) {
        DealDisplayStatus.ACTIVE -> "активна"
        DealDisplayStatus.DUE_SOON -> "скоро срок"
        DealDisplayStatus.OVERDUE -> "просрочена"
        DealDisplayStatus.RETURNED -> "закрыта"
        DealDisplayStatus.CANCELLED -> "отменена"
    }
}

private fun statusColor(status: DealDisplayStatus): Color {
    return when (status) {
        DealDisplayStatus.ACTIVE -> Color(0xFF1E6B5C)
        DealDisplayStatus.DUE_SOON -> Color(0xFF8A5A14)
        DealDisplayStatus.OVERDUE -> Color(0xFFB42318)
        DealDisplayStatus.RETURNED -> Color(0xFF667085)
        DealDisplayStatus.CANCELLED -> Color(0xFF667085)
    }
}
