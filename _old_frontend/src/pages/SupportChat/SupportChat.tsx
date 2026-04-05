import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  clientRequestsRequest, managerRequestsRequest,
  socketConnect, requestEvent
} from '../../reducers/reducersupportChat'
import { useEffect } from 'react'
import SupportRequests from './SupportRequests'
import CreateRequest from './CreateRequest'
import RequestMessages from './RequestMessages'
import { type SendRequests } from '../../reducers/typesSupportChat'

export default () => {
  const dispatch = useAppDispatch()
  const { role } = useAppSelector(state => state.reducerauthClient)
  const { requests, messages, socket, error } = useAppSelector(state => state.reducersupportChat)

  useEffect(() => {
    if (role === 'manager') {
      dispatch(managerRequestsRequest())
      dispatch(socketConnect({}))
    } else {
      dispatch(clientRequestsRequest())
    }
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('createRequest', (request: SendRequests) => {
        dispatch(requestEvent(request))
      })
    }
  }, [dispatch, socket])

  return (
    <>
      <div className="bg-teal-600 h-10 rounded-b-lg text-center pt-4 self-start w-full">Техподдержка</div>

      {requests.length !== 0 && !error && <SupportRequests/>}
      {messages.length !== 0 && !error && <RequestMessages/>}
      {messages.length === 0 && role === 'client' && <CreateRequest/> }

    </>
  )
}
