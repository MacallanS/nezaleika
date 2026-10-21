/** Сериализация WebAuthn assertion для PUT /api/user/password (factor=biometric). */

function bufferToB64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function serializeCredentialForPassword(
  credential: PublicKeyCredential,
): Record<string, unknown> {
  const response = credential.response as AuthenticatorAssertionResponse

  const payload: Record<string, unknown> = {
    id: credential.id,
    rawId: bufferToB64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToB64Url(response.clientDataJSON),
      authenticatorData: bufferToB64Url(response.authenticatorData),
      signature: bufferToB64Url(response.signature),
    },
  }

  if (response.userHandle) {
    ;(payload.response as Record<string, unknown>).userHandle = bufferToB64Url(response.userHandle)
  }

  return payload
}
