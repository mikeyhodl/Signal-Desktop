// Copyright 2018-2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactElement } from 'react';
import React from 'react';
import classNames from 'classnames';

import { formatTime } from '../../util/timestamp';

import type { LocalizerType } from '../../types/Util';
import { Time } from '../Time';
import { useNowThatUpdatesEveryMinute } from '../../hooks/useNowThatUpdatesEveryMinute';

export type Props = {
  deletedForEveryone?: boolean;
  direction?: 'incoming' | 'outgoing';
  i18n: LocalizerType;
  module?: string;
  timestamp: number;
  withImageNoCaption?: boolean;
  withSticker?: boolean;
  withTapToViewExpired?: boolean;
};

export function MessageTimestamp({
  deletedForEveryone,
  direction,
  i18n,
  module,
  timestamp,
  withImageNoCaption,
  withSticker,
  withTapToViewExpired,
}: Readonly<Props>): ReactElement {
  const now = useNowThatUpdatesEveryMinute();
  const moduleName = module || 'module-timestamp';

  return (
    <Time
      className={classNames(
        moduleName,
        direction ? `${moduleName}--${direction}` : null,
        withTapToViewExpired && direction
          ? `${moduleName}--${direction}-with-tap-to-view-expired`
          : null,
        withImageNoCaption ? `${moduleName}--with-image-no-caption` : null,
        withSticker ? `${moduleName}--with-sticker` : null,
        deletedForEveryone ? `${moduleName}--deleted-for-everyone` : null
      )}
      timestamp={timestamp}
    >
      {formatTime(i18n, timestamp, now)}
    </Time>
  );
}
