package com.blackout.data.migrations;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteTransactionListener;
import android.os.CancellationSignal;
import android.util.Pair;

import androidx.annotation.NonNull;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteQuery;
import androidx.sqlite.db.SupportSQLiteStatement;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class FakeSupportSQLiteDatabase implements SupportSQLiteDatabase {

    public final List<String> executedSql = new ArrayList<>();

    @Override
    public void execSQL(@NonNull String sql) throws SQLException {
        executedSql.add(sql);
    }

    // --- The rest of the interface is implemented as no-op stubs to satisfy the compiler ---

    @Override public SupportSQLiteStatement compileStatement(@NonNull String sql) { return null; }
    @Override public void beginTransaction() {}
    @Override public void beginTransactionNonExclusive() {}
    @Override public void beginTransactionWithListener(@NonNull SQLiteTransactionListener transactionListener) {}
    @Override public void beginTransactionWithListenerNonExclusive(@NonNull SQLiteTransactionListener transactionListener) {}
    @Override public void endTransaction() {}
    @Override public void setTransactionSuccessful() {}
    @Override public boolean inTransaction() { return false; }
    @Override public boolean isDbLockedByCurrentThread() { return false; }
    @Override public boolean yieldIfContendedSafely() { return false; }
    @Override public boolean yieldIfContendedSafely(long sleepAfterYieldDelay) { return false; }
    @Override public int getVersion() { return 1; }
    @Override public void setVersion(int version) {}
    @Override public long getMaximumSize() { return 0; }
    @Override public long setMaximumSize(long numBytes) { return 0; }
    @Override public long getPageSize() { return 0; }
    @Override public void setPageSize(long numBytes) {}
    @Override public Cursor query(@NonNull String query) { return null; }
    @Override public Cursor query(@NonNull String query, @NonNull Object[] bindArgs) { return null; }
    @Override public Cursor query(@NonNull SupportSQLiteQuery query) { return null; }
    @Override public Cursor query(@NonNull SupportSQLiteQuery query, CancellationSignal cancellationSignal) { return null; }
    @Override public long insert(@NonNull String table, int conflictAlgorithm, @NonNull ContentValues values) throws SQLException { return 0; }
    @Override public int delete(@NonNull String table, String whereClause, Object[] whereArgs) { return 0; }
    @Override public int update(@NonNull String table, int conflictAlgorithm, @NonNull ContentValues values, String whereClause, Object[] whereArgs) { return 0; }
    @Override public void execSQL(@NonNull String sql, @NonNull Object[] bindArgs) throws SQLException {}
    @Override public boolean isReadOnly() { return false; }
    @Override public boolean isOpen() { return true; }
    @Override public boolean needUpgrade(int newVersion) { return false; }
    @Override public String getPath() { return null; }
    @Override public void setLocale(@NonNull Locale locale) {}
    @Override public void setMaxSqlCacheSize(int cacheSize) {}
    @Override public void setForeignKeyConstraintsEnabled(boolean enable) {}
    @Override public boolean enableWriteAheadLogging() { return false; }
    @Override public void disableWriteAheadLogging() {}
    @Override public boolean isWriteAheadLoggingEnabled() { return false; }
    @Override public List<Pair<String, String>> getAttachedDbs() { return null; }
    @Override public boolean isDatabaseIntegrityOk() { return true; }
    @Override public void close() {}
}
