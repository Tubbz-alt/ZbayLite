import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import messagesHandlers from './messages'
import appHandlers from './app'
import nodeHandlers from './node'
import identityHandlers from './identity'
import { actionTypes } from '../../../shared/static'
import nodeSelectors from '../selectors/node'

export const initialState = {
  running: true
}

export const stopCoordinator = createAction(actionTypes.STOP_COORDINATOR)
export const startCoordinator = createAction(actionTypes.START_COORDINATOR)

const actions = {
  stopCoordinator,
  startCoordinator
}

const coordinator = () => async (dispatch, getState) => {
  const statusActions = new Map()
    .set(0, () => nodeHandlers.epics.getStatus())
    .set(1, () => identityHandlers.epics.fetchBalance())
    .set(2, () => identityHandlers.epics.fetchFreeUtxos())
    .set(3, () => messagesHandlers.epics.fetchMessages())

  const fetchStatus = async () => {
    for (let index = 0; index < statusActions.size; index++) {
      await dispatch(statusActions.get(index)())
      const isRescaning = nodeSelectors.isRescanning(getState())
      if (isRescaning) {
        dispatch(appHandlers.actions.setInitialLoadFlag(false))
        break
      }
    }
    setTimeout(fetchStatus, 25000)
  }
  fetchStatus()
}
const epics = {
  coordinator
}

export const reducer = handleActions(
  {
    [startCoordinator]: state => produce(state, (draft) => {
      draft.running = true
    }),
    [stopCoordinator]: state => produce(state, (draft) => {
      draft.running = false
    })
  },
  initialState
)

export default {
  epics,
  actions,
  reducer
}
