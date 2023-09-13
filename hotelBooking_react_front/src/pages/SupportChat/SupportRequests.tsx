import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { getHistoryRequest, makeInactiveRequest, socketConnect } from '../../reducers/reducersupportChat'
import React from 'react'
import { type SendRequests } from '../../reducers/typesSupportChat'

export default () => {
  const dispatch = useAppDispatch()
  const { role } = useAppSelector(state => state.reducerauthClient)
  const { requests } = useAppSelector(state => state.reducersupportChat)

  const handleOpenRequest = (id: string) => {
    dispatch(getHistoryRequest({ id, requests: [] }))
    dispatch(socketConnect({ id }))
  }

  const handleInactiveRequest = (id: string) => {
    dispatch(makeInactiveRequest({ id }))
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {requests.map((el: SendRequests) => (
        <React.Fragment key={el.id} >

          {role === 'manager' && <div className="self-end bg-black text-white rounded-t-lg text-center mr-3 w-9 h-5 cursor-pointer"
            onClick={() => { handleInactiveRequest(el.id) }}>x</div>}

          <div className={`border-teal-600 hover:bg-teal-600 border-2 p-3 mx-3 mb-3 rounded-b-lg rounded-tl-lg h-11
            cursor-pointer ${role === 'manager' ? '' : 'm-3 rounded-lg'}`}
            onClick={() => { handleOpenRequest(el.id) }}>
            {el.title.text}
          </div>

        </React.Fragment>
      ))}
    </div>
  )
}
