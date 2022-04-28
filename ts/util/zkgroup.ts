// Copyright 2020-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { ProfileKeyCredentialRequestContext } from '@signalapp/libsignal-client/zkgroup';
import {
  AuthCredential,
  ClientZkAuthOperations,
  ClientZkGroupCipher,
  ClientZkProfileOperations,
  GroupMasterKey,
  GroupSecretParams,
  ProfileKey,
  ProfileKeyCiphertext,
  ProfileKeyCredential,
  ProfileKeyCredentialPresentation,
  ProfileKeyCredentialResponse,
  ServerPublicParams,
  UuidCiphertext,
  NotarySignature,
} from '@signalapp/libsignal-client/zkgroup';
import { UUID } from '../types/UUID';
import type { UUIDStringType } from '../types/UUID';

export * from '@signalapp/libsignal-client/zkgroup';

// Scenarios

export function decryptGroupBlob(
  clientZkGroupCipher: ClientZkGroupCipher,
  ciphertext: Uint8Array
): Uint8Array {
  return clientZkGroupCipher.decryptBlob(Buffer.from(ciphertext));
}

export function decryptProfileKeyCredentialPresentation(
  clientZkGroupCipher: ClientZkGroupCipher,
  presentationBuffer: Uint8Array
): { profileKey: Uint8Array; uuid: UUIDStringType } {
  const presentation = new ProfileKeyCredentialPresentation(
    Buffer.from(presentationBuffer)
  );

  const uuidCiphertext = presentation.getUuidCiphertext();
  const uuid = clientZkGroupCipher.decryptUuid(uuidCiphertext);

  const profileKeyCiphertext = presentation.getProfileKeyCiphertext();
  const profileKey = clientZkGroupCipher.decryptProfileKey(
    profileKeyCiphertext,
    uuid
  );

  return {
    profileKey: profileKey.serialize(),
    uuid: UUID.cast(uuid),
  };
}

export function decryptProfileKey(
  clientZkGroupCipher: ClientZkGroupCipher,
  profileKeyCiphertextBuffer: Uint8Array,
  uuid: UUIDStringType
): Uint8Array {
  const profileKeyCiphertext = new ProfileKeyCiphertext(
    Buffer.from(profileKeyCiphertextBuffer)
  );

  const profileKey = clientZkGroupCipher.decryptProfileKey(
    profileKeyCiphertext,
    uuid
  );

  return profileKey.serialize();
}

export function decryptUuid(
  clientZkGroupCipher: ClientZkGroupCipher,
  uuidCiphertextBuffer: Uint8Array
): string {
  const uuidCiphertext = new UuidCiphertext(Buffer.from(uuidCiphertextBuffer));

  return clientZkGroupCipher.decryptUuid(uuidCiphertext);
}

export function deriveProfileKeyVersion(
  profileKeyBase64: string,
  uuid: UUIDStringType
): string {
  const profileKeyArray = Buffer.from(profileKeyBase64, 'base64');
  const profileKey = new ProfileKey(profileKeyArray);

  const profileKeyVersion = profileKey.getProfileKeyVersion(uuid);

  return profileKeyVersion.toString();
}

export function deriveGroupPublicParams(
  groupSecretParamsBuffer: Uint8Array
): Uint8Array {
  const groupSecretParams = new GroupSecretParams(
    Buffer.from(groupSecretParamsBuffer)
  );

  return groupSecretParams.getPublicParams().serialize();
}

export function deriveGroupID(groupSecretParamsBuffer: Uint8Array): Uint8Array {
  const groupSecretParams = new GroupSecretParams(
    Buffer.from(groupSecretParamsBuffer)
  );

  return groupSecretParams.getPublicParams().getGroupIdentifier().serialize();
}

export function deriveGroupSecretParams(
  masterKeyBuffer: Uint8Array
): Uint8Array {
  const masterKey = new GroupMasterKey(Buffer.from(masterKeyBuffer));
  const groupSecretParams = GroupSecretParams.deriveFromMasterKey(masterKey);

  return groupSecretParams.serialize();
}

export function encryptGroupBlob(
  clientZkGroupCipher: ClientZkGroupCipher,
  plaintext: Uint8Array
): Uint8Array {
  return clientZkGroupCipher.encryptBlob(Buffer.from(plaintext));
}

export function encryptUuid(
  clientZkGroupCipher: ClientZkGroupCipher,
  uuidPlaintext: UUIDStringType
): Uint8Array {
  const uuidCiphertext = clientZkGroupCipher.encryptUuid(uuidPlaintext);

  return uuidCiphertext.serialize();
}

export function generateProfileKeyCredentialRequest(
  clientZkProfileCipher: ClientZkProfileOperations,
  uuid: UUIDStringType,
  profileKeyBase64: string
): { context: ProfileKeyCredentialRequestContext; requestHex: string } {
  const profileKeyArray = Buffer.from(profileKeyBase64, 'base64');
  const profileKey = new ProfileKey(profileKeyArray);

  const context =
    clientZkProfileCipher.createProfileKeyCredentialRequestContext(
      uuid,
      profileKey
    );
  const request = context.getRequest();
  const requestArray = request.serialize();

  return {
    context,
    requestHex: requestArray.toString('hex'),
  };
}

export function getAuthCredentialPresentation(
  clientZkAuthOperations: ClientZkAuthOperations,
  authCredentialBase64: string,
  groupSecretParamsBase64: string
): Uint8Array {
  const authCredential = new AuthCredential(
    Buffer.from(authCredentialBase64, 'base64')
  );
  const secretParams = new GroupSecretParams(
    Buffer.from(groupSecretParamsBase64, 'base64')
  );

  const presentation = clientZkAuthOperations.createAuthCredentialPresentation(
    secretParams,
    authCredential
  );
  return presentation.serialize();
}

export function createProfileKeyCredentialPresentation(
  clientZkProfileCipher: ClientZkProfileOperations,
  profileKeyCredentialBase64: string,
  groupSecretParamsBase64: string
): Uint8Array {
  const profileKeyCredentialArray = Buffer.from(
    profileKeyCredentialBase64,
    'base64'
  );
  const profileKeyCredential = new ProfileKeyCredential(
    profileKeyCredentialArray
  );
  const secretParams = new GroupSecretParams(
    Buffer.from(groupSecretParamsBase64, 'base64')
  );

  const presentation =
    clientZkProfileCipher.createProfileKeyCredentialPresentation(
      secretParams,
      profileKeyCredential
    );

  return presentation.serialize();
}

export function getClientZkAuthOperations(
  serverPublicParamsBase64: string
): ClientZkAuthOperations {
  const serverPublicParams = new ServerPublicParams(
    Buffer.from(serverPublicParamsBase64, 'base64')
  );

  return new ClientZkAuthOperations(serverPublicParams);
}

export function getClientZkGroupCipher(
  groupSecretParamsBase64: string
): ClientZkGroupCipher {
  const serverPublicParams = new GroupSecretParams(
    Buffer.from(groupSecretParamsBase64, 'base64')
  );

  return new ClientZkGroupCipher(serverPublicParams);
}

export function getClientZkProfileOperations(
  serverPublicParamsBase64: string
): ClientZkProfileOperations {
  const serverPublicParams = new ServerPublicParams(
    Buffer.from(serverPublicParamsBase64, 'base64')
  );

  return new ClientZkProfileOperations(serverPublicParams);
}

export function handleProfileKeyCredential(
  clientZkProfileCipher: ClientZkProfileOperations,
  context: ProfileKeyCredentialRequestContext,
  responseBase64: string
): string {
  const response = new ProfileKeyCredentialResponse(
    Buffer.from(responseBase64, 'base64')
  );
  const profileKeyCredential =
    clientZkProfileCipher.receiveProfileKeyCredential(context, response);

  const credentialArray = profileKeyCredential.serialize();

  return credentialArray.toString('base64');
}

export function deriveProfileKeyCommitment(
  profileKeyBase64: string,
  uuid: UUIDStringType
): string {
  const profileKeyArray = Buffer.from(profileKeyBase64, 'base64');
  const profileKey = new ProfileKey(profileKeyArray);

  return profileKey.getCommitment(uuid).contents.toString('base64');
}

export function verifyNotarySignature(
  serverPublicParamsBase64: string,
  message: Uint8Array,
  signature: Uint8Array
): void {
  const serverPublicParams = new ServerPublicParams(
    Buffer.from(serverPublicParamsBase64, 'base64')
  );

  const notarySignature = new NotarySignature(Buffer.from(signature));

  serverPublicParams.verifySignature(Buffer.from(message), notarySignature);
}
