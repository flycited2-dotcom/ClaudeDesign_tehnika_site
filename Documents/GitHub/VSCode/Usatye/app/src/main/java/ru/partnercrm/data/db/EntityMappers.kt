package ru.partnercrm.data.db

import java.time.LocalDate
import ru.partnercrm.data.model.Deal
import ru.partnercrm.data.model.Partner
import ru.partnercrm.domain.deal.DealLifecycleStatus

fun Partner.toEntity(): PartnerEntity {
    return PartnerEntity(
        id = id,
        name = name,
        phone = phone,
        telegram = telegram,
        comment = comment,
        defaultPercent = defaultPercent,
        createdAt = createdAt,
        updatedAt = updatedAt,
        isActive = isActive,
    )
}

fun PartnerEntity.toModel(): Partner {
    return Partner(
        id = id,
        name = name,
        phone = phone,
        telegram = telegram,
        comment = comment,
        defaultPercent = defaultPercent,
        createdAt = createdAt,
        updatedAt = updatedAt,
        isActive = isActive,
    )
}

fun Deal.toEntity(): DealEntity {
    return DealEntity(
        id = id,
        partnerId = partnerId,
        amountIn = amountIn,
        percent = percent,
        amountToReturn = amountToReturn,
        profit = profit,
        dateIn = dateIn.toEpochDay(),
        dueDate = dueDate.toEpochDay(),
        dateReturned = dateReturned?.toEpochDay(),
        status = lifecycleStatus.name,
        comment = comment,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
}

fun DealEntity.toModel(): Deal {
    return Deal(
        id = id,
        partnerId = partnerId,
        amountIn = amountIn,
        percent = percent,
        amountToReturn = amountToReturn,
        profit = profit,
        dateIn = LocalDate.ofEpochDay(dateIn),
        dueDate = LocalDate.ofEpochDay(dueDate),
        dateReturned = dateReturned?.let(LocalDate::ofEpochDay),
        lifecycleStatus = DealLifecycleStatus.valueOf(status),
        comment = comment,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
}
