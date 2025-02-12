// Copyright 2019-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { format as formatPhoneNumber } from './PhoneNumber';
import { AttachmentType } from './Attachment';

export type EmbeddedContactType = {
  name?: Name;
  number?: Array<Phone>;
  email?: Array<Email>;
  address?: Array<PostalAddress>;
  avatar?: Avatar;
  organization?: string;

  // Populated by selector
  firstNumber?: string;
  isNumberOnSignal?: boolean;
};

type Name = {
  givenName?: string;
  familyName?: string;
  prefix?: string;
  suffix?: string;
  middleName?: string;
  displayName?: string;
};

export enum ContactFormType {
  HOME = 1,
  MOBILE = 2,
  WORK = 3,
  CUSTOM = 4,
}

export enum AddressType {
  HOME = 1,
  WORK = 2,
  CUSTOM = 3,
}

export type Phone = {
  value: string;
  type: ContactFormType;
  label?: string;
};

export type Email = {
  value: string;
  type: ContactFormType;
  label?: string;
};

export type PostalAddress = {
  type: AddressType;
  label?: string;
  street?: string;
  pobox?: string;
  neighborhood?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

type Avatar = {
  avatar: AttachmentType;
  isProfile: boolean;
};

export function embeddedContactSelector(
  contact: EmbeddedContactType,
  options: {
    regionCode: string;
    firstNumber?: string;
    isNumberOnSignal?: boolean;
    getAbsoluteAttachmentPath: (path: string) => string;
  }
): EmbeddedContactType {
  const {
    getAbsoluteAttachmentPath,
    firstNumber,
    isNumberOnSignal,
    regionCode,
  } = options;

  let { avatar } = contact;
  if (avatar && avatar.avatar) {
    if (avatar.avatar.error) {
      avatar = undefined;
    } else {
      avatar = {
        ...avatar,
        avatar: {
          ...avatar.avatar,
          path: avatar.avatar.path
            ? getAbsoluteAttachmentPath(avatar.avatar.path)
            : undefined,
        },
      };
    }
  }

  return {
    ...contact,
    firstNumber,
    isNumberOnSignal,
    avatar,
    number:
      contact.number &&
      contact.number.map(item => ({
        ...item,
        value: formatPhoneNumber(item.value, {
          ourRegionCode: regionCode,
        }),
      })),
  };
}

export function getName(contact: EmbeddedContactType): string | undefined {
  const { name, organization } = contact;
  const displayName = (name && name.displayName) || undefined;
  const givenName = (name && name.givenName) || undefined;
  const familyName = (name && name.familyName) || undefined;
  const backupName =
    (givenName && familyName && `${givenName} ${familyName}`) || undefined;

  return displayName || organization || backupName || givenName || familyName;
}
