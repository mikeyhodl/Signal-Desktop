// Copyright 2021-2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { times } from 'lodash';

import { setupI18n } from '../../../util/setupI18n';
import { CapabilityError } from '../../../types/errors';
import enMessages from '../../../../_locales/en/messages.json';
import type { Props } from './ConversationDetails';
import { ConversationDetails } from './ConversationDetails';
import { ChooseGroupMembersModal } from './AddGroupMembersModal/ChooseGroupMembersModal';
import { ConfirmAdditionsModal } from './AddGroupMembersModal/ConfirmAdditionsModal';
import type { ConversationType } from '../../../state/ducks/conversations';
import { getDefaultConversation } from '../../../test-both/helpers/getDefaultConversation';
import { makeFakeLookupConversationWithoutUuid } from '../../../test-both/helpers/fakeLookupConversationWithoutUuid';
import { ThemeType } from '../../../types/Util';

const i18n = setupI18n('en', enMessages);

const story = storiesOf(
  'Components/Conversation/ConversationDetails/ConversationDetails',
  module
);

const conversation: ConversationType = getDefaultConversation({
  id: '',
  lastUpdated: 0,
  title: 'Some Conversation',
  groupDescription: 'Hello World!',
  type: 'group',
  sharedGroupNames: [],
  conversationColor: 'ultramarine' as const,
});

const allCandidateContacts = times(10, () => getDefaultConversation());

const createProps = (hasGroupLink = false, expireTimer?: number): Props => ({
  addMembers: async () => {
    action('addMembers');
  },
  areWeASubscriber: false,
  canEditGroupInfo: false,
  conversation: expireTimer
    ? {
        ...conversation,
        expireTimer,
      }
    : conversation,
  hasActiveCall: false,
  hasGroupLink,
  getPreferredBadge: () => undefined,
  i18n,
  isAdmin: false,
  isGroup: true,
  loadRecentMediaItems: action('loadRecentMediaItems'),
  memberships: times(32, i => ({
    isAdmin: i === 1,
    member: getDefaultConversation({
      isMe: i === 2,
    }),
  })),
  pendingApprovalMemberships: times(8, () => ({
    member: getDefaultConversation(),
  })),
  pendingMemberships: times(5, () => ({
    metadata: {},
    member: getDefaultConversation(),
  })),
  setDisappearingMessages: action('setDisappearingMessages'),
  showAllMedia: action('showAllMedia'),
  showContactModal: action('showContactModal'),
  showChatColorEditor: action('showChatColorEditor'),
  showGroupLinkManagement: action('showGroupLinkManagement'),
  showGroupV2Permissions: action('showGroupV2Permissions'),
  showConversationNotificationsSettings: action(
    'showConversationNotificationsSettings'
  ),
  showPendingInvites: action('showPendingInvites'),
  showLightboxForMedia: action('showLightboxForMedia'),
  updateGroupAttributes: async () => {
    action('updateGroupAttributes')();
  },
  onBlock: action('onBlock'),
  onLeave: action('onLeave'),
  onUnblock: action('onUnblock'),
  deleteAvatarFromDisk: action('deleteAvatarFromDisk'),
  replaceAvatar: action('replaceAvatar'),
  saveAvatarToDisk: action('saveAvatarToDisk'),
  setMuteExpiration: action('setMuteExpiration'),
  userAvatarData: [],
  toggleSafetyNumberModal: action('toggleSafetyNumberModal'),
  onOutgoingAudioCallInConversation: action(
    'onOutgoingAudioCallInConversation'
  ),
  onOutgoingVideoCallInConversation: action(
    'onOutgoingVideoCallInConversation'
  ),
  searchInConversation: action('searchInConversation'),
  theme: ThemeType.light,
  renderChooseGroupMembersModal: props => {
    return (
      <ChooseGroupMembersModal
        {...props}
        candidateContacts={allCandidateContacts}
        selectedContacts={[]}
        regionCode="US"
        getPreferredBadge={() => undefined}
        theme={ThemeType.light}
        i18n={i18n}
        lookupConversationWithoutUuid={makeFakeLookupConversationWithoutUuid()}
        showUserNotFoundModal={action('showUserNotFoundModal')}
      />
    );
  },
  renderConfirmAdditionsModal: props => {
    return (
      <ConfirmAdditionsModal {...props} selectedContacts={[]} i18n={i18n} />
    );
  },
});

story.add('Basic', () => {
  const props = createProps();

  return <ConversationDetails {...props} />;
});

story.add('as Admin', () => {
  const props = createProps();

  return <ConversationDetails {...props} isAdmin />;
});

story.add('as last admin', () => {
  const props = createProps();

  return (
    <ConversationDetails
      {...props}
      isAdmin
      memberships={times(32, i => ({
        isAdmin: i === 2,
        member: getDefaultConversation({
          isMe: i === 2,
        }),
      }))}
    />
  );
});

story.add('as only admin', () => {
  const props = createProps();

  return (
    <ConversationDetails
      {...props}
      isAdmin
      memberships={[
        {
          isAdmin: true,
          member: getDefaultConversation({
            isMe: true,
          }),
        },
      ]}
    />
  );
});

story.add('Group Editable', () => {
  const props = createProps();

  return <ConversationDetails {...props} canEditGroupInfo />;
});

story.add('Group Editable with custom disappearing timeout', () => {
  const props = createProps(false, 3 * 24 * 60 * 60);

  return <ConversationDetails {...props} canEditGroupInfo />;
});

story.add('Group Links On', () => {
  const props = createProps(true);

  return <ConversationDetails {...props} isAdmin />;
});

story.add('Group add with missing capabilities', () => (
  <ConversationDetails
    {...createProps()}
    canEditGroupInfo
    addMembers={async () => {
      throw new CapabilityError('stories');
    }}
  />
));

story.add('1:1', () => (
  <ConversationDetails {...createProps()} isGroup={false} />
));
