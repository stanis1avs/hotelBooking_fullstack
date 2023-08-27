import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import NewRooms from './NewRooms'
import { newhotelRequest, edithotelRequest } from '../../reducers/reducerhotelPage'
import { type NewHotel } from './types'

export default () => {
  const dispatch = useAppDispatch()
  const { id, nameHotel: name, descriptionHotel: description, imageHotel: image } = useAppSelector(state => state.reducerhotelPage)

  const initialState = { nameHotel: '', descriptionHotel: '', imageHotel: null }

  const [{ nameHotel, descriptionHotel, imageHotel }, setNewHotel] = useState<NewHotel>(initialState)
  const [onOff, setOnOff] = useState(false)
  const [isEdit, setIsEdit] = useState(true)

  useEffect(() => {
    setNewHotel({
      nameHotel: name,
      descriptionHotel: description,
      imageHotel: image
    })
  }, [name, description, image])

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files != null) {
      const [file] = Array.from(files) as [File]
      setNewHotel(prevState => ({ ...prevState, imageHotel: file }))
    }
  }

  const handlerClearForm = () => {
    setNewHotel(initialState)
  }

  const handleCreateHotel = () => {
    if (imageHotel && typeof imageHotel !== 'string') {
      dispatch(newhotelRequest({ nameHotel, descriptionHotel, imageHotel }))
      setIsEdit(false)
    }
  }

  const handleEditHotel = () => {
    console.log(imageHotel)
    if (imageHotel) {
      dispatch(edithotelRequest({ nameHotel, descriptionHotel, imageHotel, id }))
    }
  }

  return (
    <>
      <section className="flex-col">
        <div className="flex">
          <img className="w-64 h-52 m-5 rounded-lg" alt={'Логотип отеля'}
          src={!imageHotel ? '' : typeof imageHotel === 'string' ? `data:'image/jpg';base64,${imageHotel}` : URL.createObjectURL(imageHotel)}/>
          <input type="file" onChange={onImageChange} style={{ width: 96, height: 64, padding: 0 }}
            className="self-center before:content-[''] before:absolute before:bg-plus before:bg-no-repeat before:bg-center before:w-24 before:h-16
            before:bg-slate-300"/>
        </div>
        <label>Название отеля</label>
        <input type="text" value={nameHotel} onChange={(e) => { setNewHotel(prevState => ({ ...prevState, nameHotel: e.target.value })) }} />
        <label>Описание отеля</label>
        <textarea style={{ height: 80 }} value={descriptionHotel} onChange={(e) => { setNewHotel(prevState => ({ ...prevState, descriptionHotel: e.target.value })) }}></textarea>
        <div className="flex">
          <button style={{ background: '#E15D5D' }} onClick={handlerClearForm}>Очистить</button>
          {id && !onOff && <button style={{ background: '#1AA053' }} onClick={handleEditHotel}>Отредактировать</button>}
          {!id && <button style={{ background: '#1AA053' }} onClick={handleCreateHotel}>Сохранить</button>}
          {id && !onOff && <button style={{ background: '#5D73E1' }} onClick={() => { setOnOff(!onOff) }}>Добавить номера</button>}
        </div>
      </section>
      {onOff && <NewRooms edit={isEdit}/>}
    </>
  )
}
