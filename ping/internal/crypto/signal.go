// Package crypto implements Signal Protocol primitives for end-to-end encryption
// This package provides the cryptographic building blocks for secure messaging
//
// IMPORTANT: This is a STUB implementation that demonstrates the architecture.
// In production, you MUST use a well-audited library like libsignal (https://github.com/signalapp/libsignal)
//
// Signal Protocol provides:
// - Double Ratchet for forward secrecy and post-compromise security
// - X3DH (Extended Triple Diffie-Hellman) for initial key exchange
// - Authentication through prekeys and identity keys
//
// The server NEVER has access to private keys or plaintext message content.
// All encryption and decryption happens on the client devices.
package crypto

import (
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/sirupsen/logrus"
)

// Errors returned by this package
var (
	ErrInvalidKeyLength     = errors.New("invalid key length")
	ErrInvalidSignature     = errors.New("invalid signature")
	ErrVerificationFailed   = errors.New("identity key verification failed")
	ErrInvalidPrekey        = errors.New("invalid prekey")
	ErrMessageDecryption    = errors.New("message decryption failed")
	ErrInvalidMessageFormat = errors.New("invalid message format")
)

// IdentityKeyPair represents a long-term identity key pair
// In Signal Protocol, this is an Ed25519 key pair
// The public key is stored on the server, the private key is NEVER stored on the server
type IdentityKeyPair struct {
	// PublicKey is the public part (32 bytes for Ed25519)
	PublicKey []byte
	
	// PrivateKey is the private part (64 bytes for Ed25519)
	// This should NEVER be sent to or stored on the server
	PrivateKey []byte
}

// IdentityKeyPairFromBytes creates an IdentityKeyPair from raw bytes
// This is used when loading a key from storage on the client
func IdentityKeyPairFromBytes(publicKey, privateKey []byte) (*IdentityKeyPair, error) {
	// Ed25519 public keys are 32 bytes
	if len(publicKey) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("%w: expected %d bytes, got %d", ErrInvalidKeyLength, ed25519.PublicKeySize, len(publicKey))
	}
	
	// Ed25519 private keys are 64 bytes (includes public key)
	if len(privateKey) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("%w: expected %d bytes, got %d", ErrInvalidKeyLength, ed25519.PrivateKeySize, len(privateKey))
	}

	return &IdentityKeyPair{
		PublicKey:  publicKey,
		PrivateKey: privateKey,
	}, nil
}

// GenerateIdentityKeyPair generates a new identity key pair
// This should be done once per device and the private key should be securely stored
func GenerateIdentityKeyPair() (*IdentityKeyPair, error) {
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate identity key: %w", err)
	}

	return &IdentityKeyPair{
		PublicKey:  publicKey,
		PrivateKey: privateKey,
	}, nil
}

// Sign signs a message with the identity key
// This is used to sign prekeys and other messages
func (ikp *IdentityKeyPair) Sign(message []byte) ([]byte, error) {
	// Ed25519 signs the message directly
	// The private key includes the public key, so we can use it directly
	return ed25519.Sign(ikp.PrivateKey, message)
}

// VerifySignature verifies a signature using the public key
func (ikp *IdentityKeyPair) VerifySignature(message, signature []byte) bool {
	return ed25519.Verify(ikp.PublicKey, message, signature)
}

// GetPublicKey returns the public key
func (ikp *IdentityKeyPair) GetPublicKey() []byte {
	// Make a copy to prevent modification
	publicKey := make([]byte, len(ikp.PublicKey))
	copy(publicKey, ikp.PublicKey)
	return publicKey
}

// IdentityKeyPublic represents just the public part of an identity key
// This is what gets stored on the server
type IdentityKeyPublic struct {
	Key []byte
}

// NewIdentityKeyPublic creates a new IdentityKeyPublic from raw bytes
func NewIdentityKeyPublic(key []byte) (*IdentityKeyPublic, error) {
	if len(key) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("%w: expected %d bytes, got %d", ErrInvalidKeyLength, ed25519.PublicKeySize, len(key))
	}
	return &IdentityKeyPublic{Key: key}, nil
}

// VerifySignature verifies a signature using this public key
func (ikp *IdentityKeyPublic) VerifySignature(message, signature []byte) bool {
	return ed25519.Verify(ikp.Key, message, signature)
}

// Equals checks if two public keys are equal
func (ikp *IdentityKeyPublic) Equals(other *IdentityKeyPublic) bool {
	return bytes.Equal(ikp.Key, other.Key)
}

// Hex returns the hex representation of the public key
func (ikp *IdentityKeyPublic) Hex() string {
	return hex.EncodeToString(ikp.Key)
}

// RegistrationID is a random 16-byte value used in Signal Protocol
// It's used to prevent replay attacks
type RegistrationID [16]byte

// GenerateRegistrationID generates a new random registration ID
func GenerateRegistrationID() *RegistrationID {
	var regID RegistrationID
	if _, err := rand.Read(regID[:]); err != nil {
		logrus.Panic("Failed to generate registration ID: ", err)
	}
	return &regID
}

// Bytes returns the registration ID as a byte slice
func (r *RegistrationID) Bytes() []byte {
	return r[:]
}

// Hex returns the hex representation
func (r *RegistrationID) Hex() string {
	return hex.EncodeToString(r[:])
}

// SignedPrekeyPair represents a signed prekey
// This is a Curve25519 key pair that is signed by the identity key
// It's rotated periodically for forward secrecy
type SignedPrekeyPair struct {
	// KeyID is the unique identifier for this prekey
	KeyID uint32
	
	// KeyPair is the Curve25519 key pair
	KeyPair *KeyPair
	
	// Signature is the signature of the public key by the identity key
	Signature []byte
}

// KeyPair represents a Curve25519 key pair
// Signal Protocol uses Curve25519 for Diffie-Hellman key exchange
type KeyPair struct {
	PublicKey  []byte
	PrivateKey []byte
}

// GenerateKeyPair generates a new Curve25519 key pair
// This is a STUB - in production, use the proper Curve25519 implementation
func GenerateKeyPair() (*KeyPair, error) {
	// In production, use proper Curve25519
	// For now, we'll use a placeholder
	// Curve25519 public and private keys are 32 bytes each
	keyPair := &KeyPair{
		PublicKey:  make([]byte, 32),
		PrivateKey: make([]byte, 32),
	}
	
	if _, err := rand.Read(keyPair.PrivateKey); err != nil {
		return nil, err
	}
	
	// In real Curve25519, the public key is derived from the private key
	// For now, we'll just use random bytes as a placeholder
	if _, err := rand.Read(keyPair.PublicKey); err != nil {
		return nil, err
	}
	
	return keyPair, nil
}

// OneTimePrekeyPair represents a one-time prekey
// These are ephemeral keys used only once for the X3DH key exchange
type OneTimePrekeyPair struct {
	// KeyID is the unique identifier for this prekey
	KeyID uint32
	
	// KeyPair is the Curve25519 key pair
	KeyPair *KeyPair
}

// GenerateOneTimePrekey generates a new one-time prekey
func GenerateOneTimePrekey(keyID uint32) (*OneTimePrekeyPair, error) {
	keyPair, err := GenerateKeyPair()
	if err != nil {
		return nil, err
	}

	return &OneTimePrekeyPair{
		KeyID:   keyID,
		KeyPair: keyPair,
	}, nil
}

// PrekeyBundle represents the set of keys needed to start a Signal Protocol session
// This is what the server returns to a client when they want to message another device
type PrekeyBundle struct {
	// RegistrationID is needed for the initial handshake
	RegistrationID *RegistrationID
	
	// DeviceID identifies which device this bundle is for
	DeviceID string
	
	// IdentityKeyPublic is the device's long-term identity public key
	IdentityKeyPublic *IdentityKeyPublic
	
	// SignedPrekeyPublic is the current signed prekey public key
	SignedPrekeyPublic []byte
	
	// SignedPrekeyID is the ID of the signed prekey
	SignedPrekeyID uint32
	
	// SignedPrekeySignature is the signature of the signed prekey public key
	SignedPrekeySignature []byte
	
	// OneTimePrekey is an available one-time prekey (if exists)
	OneTimePrekey *OneTimePrekeyPair
}

// Verify verifies the signature on the signed prekey
// This ensures the signed prekey was actually signed by the identity key
func (pb *PrekeyBundle) Verify() error {
	if pb.IdentityKeyPublic == nil {
		return fmt.Errorf("identity key public is nil")
	}

	// The signed prekey public key should be signed by the identity key
	// We verify this by checking the signature
	if !pb.IdentityKeyPublic.VerifySignature(pb.SignedPrekeyPublic, pb.SignedPrekeySignature) {
		return ErrInvalidSignature
	}

	return nil
}

// SharedSecret represents a shared secret from a key exchange
// This is the result of the X3DH key exchange
type SharedSecret []byte

// KDF1 is the first key derivation function in Signal Protocol
// This is a STUB - in production, use the proper HKDF implementation
func KDF1(input []byte) []byte {
	h := sha256.New()
	h.Write(input)
	return h.Sum(nil)
}

// KDF2 is the second key derivation function in Signal Protocol
// This is a STUB - in production, use the proper HKDF implementation
func KDF2(input []byte) []byte {
	h := sha256.New()
	h.Write(input)
	return h.Sum(nil)
}

// DeriveRootKey derives the root key from the X3DH shared secret
// This is a STUB - in production, use the proper derivation
func DeriveRootKey(sharedSecret SharedSecret) []byte {
	// In Signal Protocol, the root key is derived using HKDF
	// For now, we'll use a simple hash
	return KDF1(sharedSecret)
}

// DeriveChainKey derives the chain key from the root key
// This is used in the Double Ratchet algorithm
func DeriveChainKey(rootKey []byte) []byte {
	// In Signal Protocol, chain key = KDF1(root key, 1)
	return KDF1(append(rootKey, []byte{0x01}...))
}

// MessageKeys represents the per-message encryption keys
type MessageKeys struct {
	// EncryptionKey is used to encrypt the message
	EncryptionKey []byte
	
	// MACKey is used to compute the message authentication code
	MACKey []byte
	
	// IV (Initialization Vector) is used for AES encryption
	IV []byte
}

// DeriveMessageKeys derives message keys from the chain key
// This is used to encrypt/decrypt individual messages
func DeriveMessageKeys(chainKey []byte) *MessageKeys {
	// In Signal Protocol, message keys are derived from the chain key
	// For simplicity, we'll derive them using KDF
	keyMaterial := KDF2(chainKey)
	
	// Split into encryption key (first 32 bytes) and MAC key (next 32 bytes)
	// IV is the last 16 bytes
	return &MessageKeys{
		EncryptionKey: keyMaterial[:32],
		MACKey:        keyMaterial[32:64],
		IV:            keyMaterial[64:80],
	}
}

// EncryptedMessage represents an encrypted message
// This is what gets sent over the wire and stored in the database
type EncryptedMessage struct {
	// Ciphertext is the encrypted message content
	Ciphertext []byte
	
	// MAC is the message authentication code
	MAC []byte
	
	// IV is the initialization vector
	IV []byte
	
	// CiphertextType indicates which version of the Signal Protocol message format is used
	CiphertextType string
	
	// KeyID is the ID of the sender's signed prekey that was used
	KeyID uint32
}

// DecryptedMessage represents a decrypted message
// This is only ever seen by the client, never by the server
type DecryptedMessage struct {
	// Plaintext is the decrypted message content
	Plaintext []byte
	
	// SenderIdentityKey is the sender's identity public key
	SenderIdentityKey []byte
	
	// SenderSignedPrekeyID is the ID of the sender's signed prekey that was used
	SenderSignedPrekeyID uint32
}

// EncryptMessage encrypts a message using Signal Protocol
// This is a STUB - in production, use the proper Signal Protocol implementation
func EncryptMessage(plaintext []byte, sharedSecret SharedSecret, senderSignedPrekeyID uint32) (*EncryptedMessage, error) {
	// In Signal Protocol, message encryption uses AES-256 in CBC mode with PKCS#7 padding
	// The key is derived from the shared secret
	
	// Derive the root key and chain key
	rootKey := DeriveRootKey(sharedSecret)
	chainKey := DeriveChainKey(rootKey)
	
	// Derive message keys
	messageKeys := DeriveMessageKeys(chainKey)
	
	// For now, we'll use a simple XOR "encryption" as a placeholder
	// In production, use AES-256-CBC with proper padding
	ciphertext := make([]byte, len(plaintext))
	for i := range plaintext {
		ciphertext[i] = plaintext[i] ^ messageKeys.EncryptionKey[i%len(messageKeys.EncryptionKey)]
	}
	
	// Compute MAC (for now, just a hash)
	mac := KDF1(append(ciphertext, messageKeys.MACKey...))
	
	return &EncryptedMessage{
		Ciphertext:      ciphertext,
		MAC:            mac[:16], // Truncate to 16 bytes for MAC
		IV:             messageKeys.IV,
		CiphertextType: "signal_message_v3",
		KeyID:          senderSignedPrekeyID,
	}, nil
}

// DecryptMessage decrypts a message using Signal Protocol
// This is a STUB - in production, use the proper Signal Protocol implementation
func DecryptMessage(encryptedMsg *EncryptedMessage, sharedSecret SharedSecret) (*DecryptedMessage, error) {
	// Verify MAC first
	computedMAC := KDF1(append(encryptedMsg.Ciphertext, encryptedMsg.IV...))
	if !bytes.Equal(computedMAC[:16], encryptedMsg.MAC) {
		return nil, ErrMessageDecryption
	}
	
	// Derive the root key and chain key
	rootKey := DeriveRootKey(sharedSecret)
	chainKey := DeriveChainKey(rootKey)
	
	// Derive message keys
	messageKeys := DeriveMessageKeys(chainKey)
	
	// Decrypt (XOR with encryption key)
	plaintext := make([]byte, len(encryptedMsg.Ciphertext))
	for i := range encryptedMsg.Ciphertext {
		plaintext[i] = encryptedMsg.Ciphertext[i] ^ messageKeys.EncryptionKey[i%len(messageKeys.EncryptionKey)]
	}
	
	return &DecryptedMessage{
		Plaintext:          plaintext,
		SenderIdentityKey:  make([]byte, 32), // Placeholder
		SenderSignedPrekeyID: encryptedMsg.KeyID,
	}, nil
}

// X3DHKeyExchange performs the X3DH (Extended Triple Diffie-Hellman) key exchange
// This is used to establish the initial shared secret between two devices
//
// In Signal Protocol, X3DH uses:
// 1. DH between the initiator's ephemeral key and recipient's signed prekey
// 2. DH between the initiator's ephemeral key and recipient's identity key
// 3. DH between the initiator's ephemeral key and recipient's one-time prekey (if available)
// 4. DH between the initiator's identity key and recipient's signed prekey
//
// The shared secret is then derived using KDF from all these DH outputs
func X3DHKeyExchange(
	initiatorEphemeral *KeyPair,
	initiatorIdentity *IdentityKeyPair,
	recipientSignedPrekey *KeyPair,
	recipientIdentity *IdentityKeyPublic,
	recipientOneTimePrekey *KeyPair,
) (SharedSecret, error) {
	// This is a STUB implementation
	// In production, use the proper X3DH implementation from libsignal
	
	// For now, we'll just concatenate all the public keys and hash them
	// This is NOT secure - just a placeholder for the architecture
	
	var combined []byte
	combined = append(combined, initiatorEphemeral.PublicKey...)
	combined = append(combined, initiatorIdentity.PublicKey...)
	combined = append(combined, recipientSignedPrekey.PublicKey...)
	combined = append(combined, recipientIdentity.Key...)
	
	if recipientOneTimePrekey != nil {
		combined = append(combined, recipientOneTimePrekey.PublicKey...)
	}
	
	// Hash to get a shared secret
	h := sha256.New()
	h.Write(combined)
	return h.Sum(nil), nil
}

// GenerateRegistrationIDString generates a hex-encoded registration ID string
func GenerateRegistrationIDString() string {
	regID := GenerateRegistrationID()
	return regID.Hex()
}

// ParseRegistrationID parses a hex-encoded registration ID
func ParseRegistrationID(hexStr string) (*RegistrationID, error) {
	bytes, err := hex.DecodeString(hexStr)
	if err != nil {
		return nil, err
	}
	
	if len(bytes) != 16 {
		return nil, fmt.Errorf("invalid registration ID length: expected 16 bytes, got %d", len(bytes))
	}
	
	var regID RegistrationID
	copy(regID[:], bytes)
	return &regID, nil
}
