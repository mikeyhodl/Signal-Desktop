// Copyright 2019-2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { createSelector } from 'reselect';

import type { LocalizerType, ThemeType } from '../../types/Util';
import type { UUIDStringType } from '../../types/UUID';

import type { StateType } from '../reducer';
import type { UserStateType } from '../ducks/user';

import { isAlpha, isBeta } from '../../util/version';

export const getUser = (state: StateType): UserStateType => state.user;

export const getUserNumber = createSelector(
  getUser,
  (state: UserStateType): string | undefined => state.ourNumber
);

export const getUserDeviceId = createSelector(
  getUser,
  (state: UserStateType): number | undefined => state.ourDeviceId
);

export const getRegionCode = createSelector(
  getUser,
  (state: UserStateType): string | undefined => state.regionCode
);

export const getUserConversationId = createSelector(
  getUser,
  (state: UserStateType): string | undefined => state.ourConversationId
);

export const getUserUuid = createSelector(
  getUser,
  (state: UserStateType): UUIDStringType | undefined => state.ourUuid
);

export const getIntl = createSelector(
  getUser,
  (state: UserStateType): LocalizerType => state.i18n
);

export const getInteractionMode = createSelector(
  getUser,
  (state: UserStateType) => state.interactionMode
);

export const getAttachmentsPath = createSelector(
  getUser,
  (state: UserStateType): string => state.attachmentsPath
);

export const getStickersPath = createSelector(
  getUser,
  (state: UserStateType): string => state.stickersPath
);

export const getPlatform = createSelector(
  getUser,
  (state: UserStateType): string => state.platform
);

export const getTempPath = createSelector(
  getUser,
  (state: UserStateType): string => state.tempPath
);

export const getTheme = createSelector(
  getUser,
  (state: UserStateType): ThemeType => state.theme
);

const getVersion = createSelector(
  getUser,
  (state: UserStateType) => state.version
);

export const getIsAlpha = createSelector(getVersion, isAlpha);

export const getIsBeta = createSelector(getVersion, isBeta);
