// Copyright 2020-2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable more/no-then */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */

import type { EventHandler } from './EventTarget';
import EventTarget from './EventTarget';
import MessageReceiver from './MessageReceiver';
import type { ContactSyncEvent, GroupSyncEvent } from './messageReceiverEvents';
import MessageSender from './SendMessage';
import { assert } from '../util/assert';
import * as log from '../logging/log';
import { singleProtoJobQueue } from '../jobs/singleProtoJobQueue';
import * as Errors from '../types/errors';

class SyncRequestInner extends EventTarget {
  private started = false;

  contactSync?: boolean;

  groupSync?: boolean;

  timeout: any;

  oncontact: (event: ContactSyncEvent) => void;

  ongroup: (event: GroupSyncEvent) => void;

  timeoutMillis: number;

  constructor(
    private sender: MessageSender,
    private receiver: MessageReceiver,
    timeoutMillis?: number
  ) {
    super();

    if (
      !(sender instanceof MessageSender) ||
      !(receiver instanceof MessageReceiver)
    ) {
      throw new Error(
        'Tried to construct a SyncRequest without MessageSender and MessageReceiver'
      );
    }

    this.oncontact = this.onContactSyncComplete.bind(this);
    receiver.addEventListener('contactSync', this.oncontact);

    this.ongroup = this.onGroupSyncComplete.bind(this);
    receiver.addEventListener('groupSync', this.ongroup);

    this.timeoutMillis = timeoutMillis || 60000;
  }

  async start(): Promise<void> {
    if (this.started) {
      assert(false, 'SyncRequestInner: started more than once. Doing nothing');
      return;
    }
    this.started = true;

    const { sender } = this;

    if (window.ConversationController.areWePrimaryDevice()) {
      log.warn('SyncRequest.start: We are primary device; returning early');
      return;
    }

    log.info(
      'SyncRequest created. Sending config, block, contact, and group requests...'
    );
    try {
      await Promise.all([
        singleProtoJobQueue.add(sender.getRequestConfigurationSyncMessage()),
        singleProtoJobQueue.add(sender.getRequestBlockSyncMessage()),
        singleProtoJobQueue.add(sender.getRequestContactSyncMessage()),
        singleProtoJobQueue.add(sender.getRequestGroupSyncMessage()),
      ]);
    } catch (error: unknown) {
      log.error(
        'SyncRequest: Failed to add request jobs',
        Errors.toLogFormat(error)
      );
    }

    this.timeout = setTimeout(this.onTimeout.bind(this), this.timeoutMillis);
  }

  onContactSyncComplete() {
    this.contactSync = true;
    this.update();
  }

  onGroupSyncComplete() {
    this.groupSync = true;
    this.update();
  }

  update() {
    if (this.contactSync && this.groupSync) {
      this.dispatchEvent(new Event('success'));
      this.cleanup();
    }
  }

  onTimeout() {
    if (this.contactSync || this.groupSync) {
      this.dispatchEvent(new Event('success'));
    } else {
      this.dispatchEvent(new Event('timeout'));
    }
    this.cleanup();
  }

  cleanup() {
    clearTimeout(this.timeout);
    this.receiver.removeEventListener('contactsync', this.oncontact);
    this.receiver.removeEventListener('groupSync', this.ongroup);
    delete this.listeners;
  }
}

export default class SyncRequest {
  private inner: SyncRequestInner;

  addEventListener: (
    name: 'success' | 'timeout',
    handler: EventHandler
  ) => void;

  removeEventListener: (
    name: 'success' | 'timeout',
    handler: EventHandler
  ) => void;

  constructor(
    sender: MessageSender,
    receiver: MessageReceiver,
    timeoutMillis?: number
  ) {
    const inner = new SyncRequestInner(sender, receiver, timeoutMillis);
    this.inner = inner;
    this.addEventListener = inner.addEventListener.bind(inner);
    this.removeEventListener = inner.removeEventListener.bind(inner);
  }

  start(): void {
    this.inner.start();
  }
}
