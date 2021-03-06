import { produce } from "immer";
import { DateTime } from "luxon";
import { createAction, handleActions } from "redux-actions";
import BigNumber from "bignumber.js";
import { remote } from "electron";

import history from "../../../shared/history";
import { messageType, actionTypes } from "../../../shared/static";

import identitySelectors from "../selectors/identity";
import offersSelectors from "../selectors/offers";
import selectors from "../selectors/contacts";
import nodeSelectors from "../selectors/node";

import { DisplayableMessage } from "../../zbay/messages.types";
import { messages as zbayMessages } from "../../zbay";
import { getClient } from "../../zcash";

import { _checkMessageSize } from "./messages";
import directMessagesQueueHandlers from "./directMessagesQueue";
import removedChannelsHandlers from "./removedChannels";
import offersHandlers from "./offers";
import { ActionsType, PayloadType } from "./types";

const sendDirectMessage = (payload, redirect = true) => async (
  dispatch,
  getState
) => {
  const { spent, type, message: messageData } = payload;
  const privKey = identitySelectors.signerPrivKey(getState());
  const message = zbayMessages.createMessage({
    messageData: {
      type,
      data: messageData,
      spent:
        type === zbayMessages.messageType.TRANSFER ? new BigNumber(spent) : "0",
    },
    privKey,
  });
  const {
    replyTo: recipientAddress,
    username: recipientUsername,
  } = payload.receiver;
  dispatch(
    directMessagesQueueHandlers.epics.addDirectMessage(
      {
        message,
        recipientAddress,
        recipientUsername,
      },
      0,
      redirect
    )
  );
};
export class Contacts {
lastSeen?: DateTime;
key: string = '';
username: string = ''
address: string = ''
newMessages: string[] = [];
vaultMessages: DisplayableMessage[] = [];
messages: DisplayableMessage[] = [];
offerId?: string;
unread?: number

  constructor(values?: Partial<Contacts>) {
    Object.assign(this, values);
  }
}
export interface ISender {
  replyTo: string;
  username: string;
}

export type ContactsStore = { [key: string]: Contacts };

const initialState: ContactsStore = {};

const setMessages = createAction<{
  messages: DisplayableMessage[];
  contactAddress: string;
  username: string;
  key: string;
}>(actionTypes.SET_DIRECT_MESSAGES);
const addContact = createAction<{
  offerId?: string;
  contactAddress: string;
  username: string;
  key: string;
}>(actionTypes.ADD_CONTACT);
const addMessage = createAction<{
  key: string;
  message: { [key: string]: DisplayableMessage };
}>(actionTypes.ADD_MESSAGE);
const updateMessage = createAction<{ key: string; id: string; txid: string }>(
  actionTypes.UPDATE_MESSAGE
);
const setMessageBlockTime = createAction<{
  contactAddress: string;
  messageId: string;
  blockTime: number;
}>(actionTypes.SET_MESSAGE_BLOCKTIME);
const cleanNewMessages = createAction<{ contactAddress: string }>(
  actionTypes.CLEAN_NEW_DIRECT_MESSAGESS
);
const appendNewMessages = createAction<{
  contactAddress: string;
  messagesIds: string[];
}>(actionTypes.APPEND_NEW_DIRECT_MESSAGES);
const setLastSeen = createAction<{ lastSeen: DateTime; contact: Contacts }>(
  actionTypes.SET_CONTACTS_LAST_SEEN
);
const removeContact = createAction<{ address: string }>(
  actionTypes.REMOVE_CONTACT
);
const setUsernames = createAction<{ sender: ISender }>(
  actionTypes.SET_CONTACTS_USERNAMES
);
const setVaultMessages = createAction(actionTypes.SET_VAULT_DIRECT_MESSAGES);
const setVaultMessageBlockTime = createAction(
  actionTypes.SET_VAULT_MESSAGE_BLOCKTIME
);

export const actions = {
  setMessages,
  updateMessage,
  addMessage,
  addContact,
  setVaultMessages,
  cleanNewMessages,
  appendNewMessages,
  setLastSeen,
  setUsernames,
  removeContact,
  setMessageBlockTime,
};
export type ContactActions = ActionsType<typeof actions>;

export const loadContact = (address) => async (dispatch, getState) => {
  const contact = selectors.contact(address)(getState());
  dispatch(updateLastSeen({ contact }));
};
export const updatePendingMessage = ({ key, id, txid }) => async (
  dispatch,
  getState
) => {
  dispatch(updateMessage({ key, id, txid }));
};
export const linkUserRedirect = (contact) => async (dispatch, getState) => {
  const contacts = selectors.contacts(getState());
  if (contacts[contact.address]) {
    history.push(
      `/main/direct-messages/${contact.address}/${contact.nickname}`
    );
  }
  await dispatch(
    setUsernames({
      sender: {
        replyTo: contact.address,
        username: contact.nickname,
      },
    })
  );
  history.push(`/main/direct-messages/${contact.address}/${contact.nickname}`);
};

export const updateLastSeen = ({ contact }) => async (dispatch, getState) => {
  const lastSeen = DateTime.utc();
  const unread = selectors.newMessages(contact.address)(getState()).length;
  remote.app.badgeCount = remote.app.badgeCount - unread;
  dispatch(cleanNewMessages({ contactAddress: contact.key }));
  dispatch(
    setLastSeen({
      lastSeen,
      contact,
    })
  );
};

export const createVaultContact = ({
  contact,
  history,
  redirect = true,
}) => async (dispatch, getState) => {
  const contacts = selectors.contacts(getState());
  // Create temp user
  if (!contacts[contact.publicKey]) {
    await dispatch(
      addContact({
        key: contact.publicKey,
        username: contact.nickname,
        contactAddress: contact.address,
      })
    );
  }
  if (redirect === true) {
    history.push(
      `/main/direct-messages/${contact.publicKey}/${contact.nickname}`
    );
  }
};

export const deleteChannel = ({ address, timestamp, history }) => async (
  dispatch,
  getState
) => {
  history.push(`/main/channel/general`);
  await dispatch(removedChannelsHandlers.epics.getRemovedChannelsTimestamp());
  dispatch(removeContact(address));
};
export const checkConfirmationOfTransfers = async (dispatch, getState) => {
  try {
    const latestBlock = parseInt(nodeSelectors.latestBlock(getState()));
    const contacts = selectors.contacts(getState());
    const offers = offersSelectors.offers(getState());
    const getKeys = (obj: ContactsStore) => Object.keys(obj);
    for (const key of getKeys(contacts)) {
      for (const msg of contacts[key].messages) {
        if (
          (msg.type === messageType.ITEM_TRANSFER ||
            msg.type === messageType.TRANSFER) &&
          msg.blockTime === Number.MAX_SAFE_INTEGER
        ) {
          const tx = await getClient().confirmations.getResult(msg.id);
          dispatch(
            setMessageBlockTime({
              contactAddress: key,
              messageId: msg[0].messageId,
              blockTime: latestBlock - tx.confirmations,
            })
          );
        }
      }
      for (const msg of contacts[key].vaultMessages) {
        if (
          (msg.type === messageType.ITEM_TRANSFER ||
            msg.type === messageType.TRANSFER) &&
          msg.blockTime === Number.MAX_SAFE_INTEGER
        ) {
          const tx = await getClient().confirmations.getResult(msg.id);
          dispatch(
            setVaultMessageBlockTime({
              contactAddress: key,
              messageId: msg.id,
              blockTime: latestBlock - tx.confirmations,
            })
          );
        }
      }
    }
    for (const key of Array.from(offers.keys())) {
      for (const msg of offers.get(key).messages) {
        if (
          (msg.type === messageType.ITEM_TRANSFER ||
            msg.type === messageType.TRANSFER) &&
          msg.blockTime === Number.MAX_SAFE_INTEGER
        ) {
          const tx = await getClient().confirmations.getResult(msg.id);
          dispatch(
            offersHandlers.actions.setOfferMessageBlockTime({
              itemId: key,
              messageId: msg.id,
              blockTime: latestBlock - tx.confirmations,
            })
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};
export const epics = {
  updateLastSeen,
  sendDirectMessage,
  loadContact,
  createVaultContact,
  deleteChannel,
  linkUserRedirect,
  checkConfirmationOfTransfers,
};

export const reducer = handleActions<ContactsStore, PayloadType<ContactActions>>(
  {
    [setMessages.toString()]: (
      state,
      {
        payload: { key, username, contactAddress, messages },
      }: ContactActions["setMessages"]
    ) =>
      produce(state, (draft) => {
        if (!draft[key]) {
          draft[key] = {
            lastSeen: null,
            messages: [],
            newMessages: [],
            vaultMessages: [],
            offerId: null,
            key,
            address: contactAddress,
            username,
          };
        }
        draft[key].messages = {
          ...draft[key].messages,
          ...messages,
        };
      }),
    [addContact.toString()]: (
      state,
      {
        payload: { key, username, contactAddress, offerId = null },
      }: ContactActions["addContact"]
    ) =>
      produce(state, (draft) => {
        draft[key] = {
          lastSeen: null,
          messages: [],
          newMessages: [],
          vaultMessages: [],
          offerId: offerId,
          key,
          address: contactAddress,
          username,
        };
      }),
    [addMessage.toString()]: (
      state,
      { payload: { key, message } }: ContactActions["addMessage"]
    ) =>
      produce(state, (draft) => {
        draft[key].messages = {
          ...draft[key].messages,
          ...message,
        };
      }),
    [updateMessage.toString()]: (
      state,
      { payload: { key, id, txid } }: ContactActions["updateMessage"]
    ) =>
      produce(state, (draft) => {
        const tempMsg = draft[key].messages[id];
        delete draft[key].messages[id];
        draft[key].messages[txid] = tempMsg;
      }),
    [setMessageBlockTime.toString()]: (
      state,
      {
        payload: { contactAddress, messageId, blockTime },
      }: ContactActions["setMessageBlockTime"]
    ) =>
      produce(state, (draft) => {
        draft[contactAddress].messages[messageId].blockTime = blockTime;
      }),
    [cleanNewMessages.toString()]: (
      state,
      { payload: { contactAddress } }: ContactActions["cleanNewMessages"]
    ) =>
      produce(state, (draft) => {
        draft[contactAddress].newMessages = [];
      }),
    [appendNewMessages.toString()]: (
      state,
      {
        payload: { contactAddress, messagesIds },
      }: ContactActions["appendNewMessages"]
    ) =>
      produce(state, (draft) => {
        const newMessagesLength = draft[contactAddress].newMessages.length;
        remote.app.setBadgeCount(
          remote.app.getBadgeCount() - newMessagesLength + messagesIds.length
        );
        draft[contactAddress].newMessages = messagesIds;
      }),
    [setLastSeen.toString()]: (
      state,
      { payload: { lastSeen, contact } }: ContactActions["setLastSeen"]
    ) =>
      produce(state, (draft) => {
        draft[contact.key].lastSeen = lastSeen;
      }),
    [removeContact.toString()]: (
      state,
      { payload: { address } }: ContactActions["removeContact"]
    ) =>
      produce(state, (draft) => {
        delete draft[address];
      }),
    [setUsernames.toString()]: (
      state,
      { payload: { sender } }: ContactActions["setUsernames"]
    ) =>
      produce(state, (draft) => {
        draft[sender.replyTo].username = sender.username;
        draft[sender.replyTo].address = sender.replyTo;
      }),
  },
  initialState
);

export default {
  epics,
  actions,
  reducer,
};
