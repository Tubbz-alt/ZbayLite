import React from 'react'
import PropTypes from 'prop-types'

import List from '@material-ui/core/List'

import ChannelsListItem from '../../../containers/widgets/channels/ChannelsListItem'
import OfferListItem from '../../../containers/widgets/channels/OfferListItem'
import { unknownUserId } from '../../../../shared/static'

export const propTypes = {
  channel: PropTypes.shape({
    name: PropTypes.string.isRequired,
    private: PropTypes.bool.isRequired,
    hash: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    unread: PropTypes.number,
    description: PropTypes.string
  })
}

export const BaseChannelsList = ({
  channels,
  unknownMessages,
  directMessages,
  selected,
  offers,
  selectedOffer
}) => {
  const [...keys] = Object.keys(offers)
  return (
    <List disablePadding>
      {channels
        .filter(ch => ch.username !== unknownUserId)
        .map(channel => (
          <ChannelsListItem
            key={channel.key}
            channel={channel}
            directMessages={directMessages}
            selected={selected}
          />
        ))}
      {Array.from(Object.values(offers)).map((offer, index) => (
        <OfferListItem
          key={keys[index]}
          channel={offer}
          selected={selectedOffer}
        />
      ))}
      {unknownMessages.length > 0 && (
        <ChannelsListItem
          key={unknownUserId}
          channel={unknownMessages[0]}
          directMessages={directMessages}
          selected={selected}
        />
      )}
    </List>
  )
}

BaseChannelsList.propTypes = {
  channels: PropTypes.array.isRequired,
  unknownMessages: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  selectedOffer: PropTypes.array.isRequired,
  directMessages: PropTypes.bool
}

BaseChannelsList.defaultProps = {
  channels: [],
  unknownMessages: [],
  offers: {},
  displayAddress: false,
  directMessages: false
}

export default React.memo(BaseChannelsList)
