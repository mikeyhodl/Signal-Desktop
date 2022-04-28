// Copyright 2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { getSendOptions } from '../../util/getSendOptions';
import { isDirectConversation, isMe } from '../../util/whatTypeOfConversation';
import { SignalService as Proto } from '../../protobuf';
import {
  handleMultipleSendErrors,
  maybeExpandErrors,
} from './handleMultipleSendErrors';
import { wrapWithSyncMessageSend } from '../../util/wrapWithSyncMessageSend';
import { ourProfileKeyService } from '../../services/ourProfileKey';

import type { ConversationModel } from '../../models/conversations';
import type {
  ExpirationTimerUpdateJobData,
  ConversationQueueJobBundle,
} from '../conversationJobQueue';
import { handleMessageSend } from '../../util/handleMessageSend';
import { isConversationAccepted } from '../../util/isConversationAccepted';
import { isConversationUnregistered } from '../../util/isConversationUnregistered';

export async function sendDirectExpirationTimerUpdate(
  conversation: ConversationModel,
  {
    isFinalAttempt,
    shouldContinue,
    timeRemaining,
    timestamp,
    log,
  }: ConversationQueueJobBundle,
  data: ExpirationTimerUpdateJobData
): Promise<void> {
  if (!shouldContinue) {
    log.info('Ran out of time. Giving up on sending expiration timer update');
    return;
  }

  if (!isDirectConversation(conversation.attributes)) {
    log.error(
      `Conversation ${conversation.idForLogging()} is not a 1:1 conversation; cancelling expiration timer job.`
    );
    return;
  }

  if (conversation.isUntrusted()) {
    window.reduxActions.conversations.conversationStoppedByMissingVerification({
      conversationId: conversation.id,
      untrustedConversationIds: [conversation.id],
    });
    throw new Error(
      'Expiration timer send blocked because conversation is untrusted. Failing this attempt.'
    );
  }

  log.info(
    `Starting expiration timer update for ${conversation.idForLogging()} with timestamp ${timestamp}`
  );

  const { expireTimer } = data;

  const sendOptions = await getSendOptions(conversation.attributes);
  let profileKey: Uint8Array | undefined;
  if (conversation.get('profileSharing')) {
    profileKey = await ourProfileKeyService.get();
  }

  const { ContentHint } = Proto.UnidentifiedSenderMessage.Message;
  const contentHint = ContentHint.RESENDABLE;

  const sendType = 'expirationTimerUpdate';
  const flags = Proto.DataMessage.Flags.EXPIRATION_TIMER_UPDATE;
  const proto = await window.textsecure.messaging.getContentMessage({
    expireTimer,
    flags,
    profileKey,
    recipients: conversation.getRecipients(),
    timestamp,
  });

  if (!proto.dataMessage) {
    log.error(
      "ContentMessage proto didn't have a data message; cancelling job."
    );
    return;
  }

  const logId = `expirationTimerUdate/${conversation.idForLogging()}`;

  try {
    if (isMe(conversation.attributes)) {
      await handleMessageSend(
        window.textsecure.messaging.sendSyncMessage({
          encodedDataMessage: Proto.DataMessage.encode(
            proto.dataMessage
          ).finish(),
          destination: conversation.get('e164'),
          destinationUuid: conversation.get('uuid'),
          expirationStartTimestamp: null,
          options: sendOptions,
          timestamp,
        }),
        { messageIds: [], sendType }
      );
    } else if (isDirectConversation(conversation.attributes)) {
      if (!isConversationAccepted(conversation.attributes)) {
        log.info(
          `conversation ${conversation.idForLogging()} is not accepted; refusing to send`
        );
        return;
      }
      if (isConversationUnregistered(conversation.attributes)) {
        log.info(
          `conversation ${conversation.idForLogging()} is unregistered; refusing to send`
        );
        return;
      }
      if (conversation.isBlocked()) {
        log.info(
          `conversation ${conversation.idForLogging()} is blocked; refusing to send`
        );
        return;
      }

      await wrapWithSyncMessageSend({
        conversation,
        logId,
        messageIds: [],
        send: async sender =>
          sender.sendIndividualProto({
            contentHint,
            identifier: conversation.getSendTarget(),
            options: sendOptions,
            proto,
            timestamp,
          }),
        sendType,
        timestamp,
      });
    }
  } catch (error: unknown) {
    await handleMultipleSendErrors({
      errors: maybeExpandErrors(error),
      isFinalAttempt,
      log,
      timeRemaining,
      toThrow: error,
    });
  }
}
