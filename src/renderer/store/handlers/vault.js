import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import crypto from 'crypto'
import { ipcRenderer } from 'electron'
import axios from 'axios'

import {
  typeFulfilled,
  typeRejected,
  typePending,
  errorNotification
} from './utils'
import identityHandlers from './identity'
import notificationsHandlers from './notifications'
import logsHandlers from '../handlers/logs'
import nodeHandlers from '../handlers/node'
import { actionCreators } from '../handlers/modals'
import { REQUEST_MONEY_ENDPOINT, actionTypes } from '../../../shared/static'
import electronStore, { migrationStore } from '../../../shared/electronStore'

export const VaultState = {
  exists: null,
  creating: false,
  unlocking: false,
  creatingIdentity: false,
  locked: true,
  isLogIn: false,
  error: ''
}

export const initialState = {
  ...VaultState
}

const createVault = createAction(actionTypes.CREATE_VAULT)
const unlockVault = createAction(
  actionTypes.UNLOCK_VAULT,
  ({ ignoreError = false }) => ({ ignoreError })
)
const createIdentity = createAction(actionTypes.CREATE_VAULT_IDENTITY)
const updateIdentitySignerKeys = createAction(
  actionTypes.UPDATE_IDENTITY_SIGNER_KEYS
)
const clearError = createAction(actionTypes.CLEAR_VAULT_ERROR)
const setVaultStatus = createAction(actionTypes.SET_VAULT_STATUS)
const setLoginSuccessfull = createAction(actionTypes.SET_LOGIN_SUCCESSFULL)

export const actions = {
  createIdentity,
  updateIdentitySignerKeys,
  createVault,
  unlockVault,
  setVaultStatus,
  clearError,
  setLoginSuccessfull
}

const loadVaultStatus = () => async (dispatch, getState) => {
  await dispatch(setVaultStatus(true))
}

const createVaultEpic = (fromMigrationFile = false) => async (
  dispatch,
  getState
) => {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  try {
    electronStore.set('isNewUser', true)
    dispatch(
      logsHandlers.epics.saveLogs({
        type: 'APPLICATION_LOGS',
        payload: `Setting user status: 'new'`
      })
    )
    electronStore.set('vaultPassword', randomBytes)
    const identity = await dispatch(
      identityHandlers.epics.createIdentity({
        name: randomBytes,
        fromMigrationFile
      })
    )
    await dispatch(nodeHandlers.actions.setIsRescanning(true))

    await dispatch(identityHandlers.epics.setIdentity(identity))
    await dispatch(identityHandlers.epics.loadIdentity(identity))
    await dispatch(setVaultStatus(true))
    ipcRenderer.send('vault-created')
    try {
      console.log('get Money')
      axios.get(REQUEST_MONEY_ENDPOINT, {
        params: {
          address: identity.address
        }
      })
    } catch (error) {
      console.log('error')
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          errorNotification({
            message: `Request to faucet failed.`
          })
        )
      )
    }
    return identity
  } catch (error) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({
          message: `Failed to create vault: ${error.message}`
        })
      )
    )
  }
}
export const setVaultIdentity = () => async (dispatch, getState) => {
  try {
    const identity = electronStore.get('identity')
    await dispatch(identityHandlers.epics.setIdentity(identity))
  } catch (err) {
    console.log(err)
  }
}

const unlockVaultEpic = (
  { password: masterPassword },
  formActions,
  setDone
) => async (dispatch, getState) => {
  await dispatch(setLoginSuccessfull(false))
  setDone(false)
  if (migrationStore.has('identity')) {
    await dispatch(createVaultEpic(true))
  } else {
    const identity = electronStore.get('identity')
    if (!identity) {
      dispatch(actionCreators.openModal('registrationGuide')())
      await dispatch(createVaultEpic())
    } else {
      console.log('setid')
      await dispatch(setVaultIdentity())
    }
  }

  await dispatch(setLoginSuccessfull(true))
  formActions.setSubmitting(false)
  setDone(true)
}

export const epics = {
  loadVaultStatus,
  setVaultIdentity,
  createVault: createVaultEpic,
  unlockVault: unlockVaultEpic
}

export const reducer = handleActions(
  {
    [typePending(actionTypes.CREATE_VAULT)]: state =>
      produce(state, (draft) => {
        draft.creating = true
      }),
    [typeFulfilled(actionTypes.CREATE_VAULT)]: state =>
      produce(state, (draft) => {
        draft.creating = false
        draft.exists = true
      }),
    [typeRejected(actionTypes.CREATE_VAULT)]: (state, { payload: error }) =>
      produce(state, (draft) => {
        draft.creating = false
        draft.error = error.message
      }),
    [typePending(actionTypes.UNLOCK_VAULT)]: state =>
      produce(state, (draft) => {
        draft.unlocking = true
      }),
    [typeFulfilled(actionTypes.UNLOCK_VAULT)]: (state, payload) =>
      produce(state, (draft) => {
        draft.unlocking = false
        draft.locked = false
      }),
    [typeRejected(actionTypes.UNLOCK_VAULT)]: (state, { payload: error }) =>
      produce(state, (draft) => {
        draft.unlocking = false
        draft.locked = true
        draft.error = error.message
      }),
    [typePending(actionTypes.CREATE_VAULT_IDENTITY)]: state =>
      produce(state, (draft) => {
        draft.creatingIdentity = true
      }),
    [typeFulfilled(actionTypes.CREATE_VAULT_IDENTITY)]: state =>
      produce(state, (draft) => {
        draft.createIdentity = false
      }),
    [typeRejected(actionTypes.CREATE_VAULT_IDENTITY)]: (
      state,
      { payload: error }
    ) =>
      produce(state, (draft) => {
        draft.creatingIdentity = false
        draft.error = error.message
      }),
    [setLoginSuccessfull]: (state, { payload: isLogIn }) =>
      produce(state, (draft) => {
        draft.isLogIn = isLogIn
      }),
    [setVaultStatus]: (state, { payload: exists }) =>
      produce(state, (draft) => {
        draft.exists = exists
      }),
    [clearError]: state => produce(state, (draft) => {
      draft.error = ''
    })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
