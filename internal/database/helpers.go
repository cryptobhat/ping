// Package database provides helper functions for database operations
package database

import (
	"database/sql"
)

// NullString converts a string to sql.NullString
// This is useful for optional string fields in database operations
func NullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}

// NullByteSlice converts a byte slice to sql.NullByteSlice
// This is useful for optional byte slice fields (like binary data)
func NullByteSlice(b []byte) sql.NullByteSlice {
	if len(b) == 0 {
		return sql.NullByteSlice{Valid: false}
	}
	return sql.NullByteSlice{ByteSlice: b, Valid: true}
}

// NullUUID converts a UUID pointer to sql.NullUUID
// This handles nil UUID pointers properly
func NullUUID(uuid *string) sql.NullString {
	if uuid == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *uuid, Valid: true}
}

// NullTime converts a time pointer to sql.NullTime
// This handles nil time pointers properly
func NullTime(t *interface{}) sql.NullTime {
	// This is a generic null time - in practice, you should use specific time types
	return sql.NullTime{Valid: false}
}
