import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useNavigate } from 'react-router-dom'
import { newroomRequest, editroomRequest } from '../../reducers/reducerhotelPage'
// import { type ImagesRoom } from './types'

export default ({ type, images, description, roomId, edit }: { type: string, images: any, description: any, roomId: any, edit: boolean }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { id } = useAppSelector(state => state.reducerhotelPage)

  const [imagesRoom, setImagesRoom] = useState<[string | Blob | null, string | Blob | null]>([null, null])
  const [descriptionRoom, setdescriptionRoom] = useState('')
  const [editing, setEdit] = useState(false)

  useEffect(() => {
    setdescriptionRoom(description)
    setImagesRoom(images)
    setEdit(edit)
  }, [])
  
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const [file1, file2] = Array.from(files) as [File, File | undefined]
      if (file1) {
        imagesRoom[0]
          ? setImagesRoom([imagesRoom[0], file1])
          : setImagesRoom([file1, null])
      }
      if (file2) {
        setImagesRoom([file1, file2])
      }
    }
  }

  const handlerClearForm = () => {
    setImagesRoom([null, null])
    setdescriptionRoom('')
  }

  const handlerCreateRoom = () => {
    if (imagesRoom[0] && imagesRoom[1]) {
      dispatch(newroomRequest({
        descriptionRoom,
        imagesRoom,
        id
      }))
      navigate(`/allhotels/${id}`)
    }
  }

  const handlerEditRoom = () => {
    if (imagesRoom[0] && imagesRoom[1] && roomId) {
      dispatch(editroomRequest({
        descriptionRoom,
        imagesRoom,
        roomId
      }))
      navigate(`/allhotels/${id}`)
    }
  }

  const putImage = (index: number) => {
    const image = imagesRoom[index]
    if (!image) {
      return ''
    }
    return typeof image === 'string' ? `data:'image/jpg';base64,${image}` : URL.createObjectURL(image)
  }

  return (
    <section className="flex-col">
      <div className="flex">
        <img className="w-64 h-52 m-5 rounded-lg" alt={`Спальня в номере ${type}`} src={putImage(0)}/>
        <img className="w-64 h-52 m-5 rounded-lg" alt={`Санузел в номере ${type}`} src={putImage(1)}/>
        <input type="file" onChange={(e) => { onImageChange(e) }} style={{ width: 96, height: 64, padding: 0 }}
          className="self-center before:content-[''] before:absolute before:bg-plus before:bg-no-repeat before:bg-center before:w-24 before:h-16
          before:bg-slate-300" multiple/>
      </div>
      <h3 className="ml-2.5 my-5">{type}</h3>
      <label>Описание отеля</label>
      <textarea style={{ height: 80 }} value={descriptionRoom} onChange={(e) => { setdescriptionRoom(e.target.value) }}></textarea>
      <div className="flex">
        <button style={{ background: '#E15D5D' }} onClick={() => { handlerClearForm() }}>Очистить</button>
        {!editing && <button style={{ background: '#1AA053' }} onClick={() => { handlerCreateRoom() }}>Сохранить</button>}
        {editing && <button style={{ background: '#1AA053' }} onClick={() => { handlerEditRoom() }}>Отредактировать</button>}
      </div>
    </section>
  )
}
