// Copyright 2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { ToastFailedToFetchUsername } from '../components/ToastFailedToFetchUsername';
import { ToastFailedToFetchPhoneNumber } from '../components/ToastFailedToFetchPhoneNumber';
import type { UserNotFoundModalStateType } from '../state/ducks/globalModals';
import * as log from '../logging/log';
import { UUID } from '../types/UUID';
import type { UUIDStringType } from '../types/UUID';
import { isValidUsername } from '../types/Username';
import * as Errors from '../types/errors';
import { HTTPError } from '../textsecure/Errors';
import { showToast } from './showToast';
import { strictAssert } from './assert';
import type { UUIDFetchStateKeyType } from './uuidFetchState';

export type LookupConversationWithoutUuidActionsType = Readonly<{
  lookupConversationWithoutUuid: typeof lookupConversationWithoutUuid;
  showUserNotFoundModal: (state: UserNotFoundModalStateType) => void;
  setIsFetchingUUID: (
    identifier: UUIDFetchStateKeyType,
    isFetching: boolean
  ) => void;
}>;

export type LookupConversationWithoutUuidOptionsType = Omit<
  LookupConversationWithoutUuidActionsType,
  'lookupConversationWithoutUuid'
> &
  Readonly<
    | {
        type: 'e164';
        e164: string;
        phoneNumber: string;
      }
    | {
        type: 'username';
        username: string;
      }
  >;

type FoundUsernameType = {
  uuid: UUIDStringType;
  username: string;
};

export async function lookupConversationWithoutUuid(
  options: LookupConversationWithoutUuidOptionsType
): Promise<string | undefined> {
  const knownConversation = window.ConversationController.get(
    options.type === 'e164' ? options.e164 : options.username
  );
  if (knownConversation && knownConversation.get('uuid')) {
    return knownConversation.id;
  }

  const identifier: UUIDFetchStateKeyType =
    options.type === 'e164'
      ? `e164:${options.e164}`
      : `username:${options.username}`;

  const { showUserNotFoundModal, setIsFetchingUUID } = options;
  setIsFetchingUUID(identifier, true);

  try {
    let conversationId: string | undefined;
    if (options.type === 'e164') {
      const serverLookup = await window.textsecure.messaging.getUuidsForE164s([
        options.e164,
      ]);

      if (serverLookup[options.e164]) {
        conversationId = window.ConversationController.ensureContactIds({
          e164: options.e164,
          uuid: serverLookup[options.e164],
          highTrust: true,
          reason: 'startNewConversationWithoutUuid(e164)',
        });
      }
    } else {
      const foundUsername = await checkForUsername(options.username);
      if (foundUsername) {
        conversationId = window.ConversationController.ensureContactIds({
          uuid: foundUsername.uuid,
          highTrust: true,
          reason: 'startNewConversationWithoutUuid(username)',
        });

        const convo = window.ConversationController.get(conversationId);
        strictAssert(convo, 'We just ensured conversation existence');

        convo.set({ username: foundUsername.username });
      }
    }

    if (!conversationId) {
      showUserNotFoundModal(
        options.type === 'username'
          ? options
          : {
              type: 'phoneNumber',
              phoneNumber: options.phoneNumber,
            }
      );
      return undefined;
    }

    return conversationId;
  } catch (error) {
    log.error(
      'startNewConversationWithoutUuid: Something went wrong fetching:',
      Errors.toLogFormat(error)
    );

    if (options.type === 'e164') {
      showToast(ToastFailedToFetchPhoneNumber);
    } else {
      showToast(ToastFailedToFetchUsername);
    }

    return undefined;
  } finally {
    setIsFetchingUUID(identifier, false);
  }
}

async function checkForUsername(
  username: string
): Promise<FoundUsernameType | undefined> {
  if (!isValidUsername(username)) {
    return undefined;
  }

  try {
    const profile = await window.textsecure.messaging.getProfileForUsername(
      username
    );

    if (!profile.uuid) {
      log.error("checkForUsername: Returned profile didn't include a uuid");
      return;
    }

    return {
      uuid: UUID.cast(profile.uuid),
      username,
    };
  } catch (error) {
    if (!(error instanceof HTTPError)) {
      throw error;
    }

    if (error.code === 404) {
      return undefined;
    }

    throw error;
  }
}
