package com.blackout.data.migrations;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class DatabaseMigrationsTest {

    @Test
    public void testMigration1To2_AddsIsReadColumn() {
        FakeSupportSQLiteDatabase fakeDb = new FakeSupportSQLiteDatabase();
        
        DatabaseMigrations.MIGRATION_1_2.migrate(fakeDb);
        
        assertEquals(1, fakeDb.executedSql.size());
        assertEquals("ALTER TABLE network_messages ADD COLUMN isRead INTEGER NOT NULL DEFAULT 0", fakeDb.executedSql.get(0));
    }

    @Test
    public void testMigration2To3_CreatesContactsTable() {
        FakeSupportSQLiteDatabase fakeDb = new FakeSupportSQLiteDatabase();

        DatabaseMigrations.MIGRATION_2_3.migrate(fakeDb);

        assertEquals(1, fakeDb.executedSql.size());
        assertEquals("CREATE TABLE IF NOT EXISTS contacts (peerId TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, transport TEXT NOT NULL, transportAddress TEXT, lastSeenAt INTEGER NOT NULL, isFavorite INTEGER NOT NULL DEFAULT 0, customNickname TEXT)", fakeDb.executedSql.get(0));
    }
}
