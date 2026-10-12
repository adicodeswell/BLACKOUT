package com.blackout.data.migrations;

import androidx.annotation.NonNull;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;

public class DatabaseMigrations {

    /**
     * Example Migration: Upgrading database from Version 1 to Version 2.
     * This adds a dummy "isRead" column to NetworkMessages to prove the migration path.
     */
    public static final Migration MIGRATION_1_2 = new Migration(1, 2) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            database.execSQL("ALTER TABLE network_messages ADD COLUMN isRead INTEGER NOT NULL DEFAULT 0");
        }
    };

    /**
     * Migration: Upgrading database from Version 2 to Version 3.
     * Creates the persistent contacts table.
     */
    public static final Migration MIGRATION_2_3 = new Migration(2, 3) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            database.execSQL("CREATE TABLE IF NOT EXISTS contacts ("
                    + "peerId TEXT NOT NULL PRIMARY KEY, "
                    + "name TEXT NOT NULL, "
                    + "transport TEXT NOT NULL, "
                    + "transportAddress TEXT, "
                    + "lastSeenAt INTEGER NOT NULL, "
                    + "isFavorite INTEGER NOT NULL DEFAULT 0, "
                    + "customNickname TEXT)");
        }
    };

    /**
     * Array of all registered migrations.
     * RoomDataEngine will apply these sequentially to prevent data loss.
     */
    public static final Migration[] ALL_MIGRATIONS = new Migration[]{
            MIGRATION_1_2,
            MIGRATION_2_3
    };
}
