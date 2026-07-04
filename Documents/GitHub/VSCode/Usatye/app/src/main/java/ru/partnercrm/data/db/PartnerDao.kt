package ru.partnercrm.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface PartnerDao {
    @Query("SELECT * FROM partners ORDER BY name COLLATE NOCASE")
    fun observeAll(): Flow<List<PartnerEntity>>

    @Query("SELECT * FROM partners ORDER BY name COLLATE NOCASE")
    suspend fun getAll(): List<PartnerEntity>

    @Query("SELECT * FROM partners WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): PartnerEntity?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(partner: PartnerEntity): Long

    @Update
    suspend fun update(partner: PartnerEntity)

    @Query("UPDATE partners SET isActive = 0, updatedAt = :updatedAt WHERE id = :id")
    suspend fun archive(id: Long, updatedAt: Long)

    @Query("DELETE FROM partners WHERE id = :id")
    suspend fun delete(id: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWithId(partner: PartnerEntity): Long

    @Query("DELETE FROM partners")
    suspend fun deleteAll()
}
