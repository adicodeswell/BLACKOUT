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
}
