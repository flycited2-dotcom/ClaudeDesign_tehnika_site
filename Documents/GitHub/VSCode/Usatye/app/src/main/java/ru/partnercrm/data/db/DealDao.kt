package ru.partnercrm.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface DealDao {
    @Query("SELECT * FROM deals ORDER BY dueDate ASC")
    fun observeAll(): Flow<List<DealEntity>>

    @Query("SELECT * FROM deals ORDER BY dueDate ASC")
    suspend fun getAll(): List<DealEntity>

    @Query("SELECT * FROM deals WHERE partnerId = :partnerId ORDER BY dueDate ASC")
    fun observeByPartner(partnerId: Long): Flow<List<DealEntity>>

    @Query("SELECT * FROM deals WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): DealEntity?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(deal: DealEntity): Long

    @Update
    suspend fun update(deal: DealEntity)

    @Query("DELETE FROM deals WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("DELETE FROM deals WHERE partnerId = :partnerId")
    suspend fun deleteByPartner(partnerId: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWithId(deal: DealEntity): Long

    @Query("DELETE FROM deals")
    suspend fun deleteAll()
}
