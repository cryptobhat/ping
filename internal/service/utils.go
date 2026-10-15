// Package service contains the business logic for the application
// This file contains utility functions used across services
package service

import (
	"errors"
	"strings"
)

// IsNotFoundError checks if an error indicates a resource was not found
// This is used for consistent error handling across repositories
func IsNotFoundError(err error) bool {
	if err == nil {
		return false
	}
	
	// Check if error is a standard "not found" error
	if errors.Is(err, ErrUserNotFound) {
		return true
	}
	
	// Check if error message contains "not found"
	// This handles repository-level errors
	if strings.Contains(strings.ToLower(err.Error()), "not found") {
		return true
	}
	
	return false
}

// IsAlreadyExistsError checks if an error indicates a resource already exists
func IsAlreadyExistsError(err error) bool {
	if err == nil {
		return false
	}
	
	if errors.Is(err, ErrUserAlreadyExists) {
		return true
	}
	
	if strings.Contains(strings.ToLower(err.Error()), "already exists") {
		return true
	}
	
	return false
}
