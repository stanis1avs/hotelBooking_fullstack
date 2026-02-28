// import React, { useState, useEffect } from 'react'
import { useAppSelector } from '../../store/hooks'
// import { useNavigate } from 'react-router-dom'
// import { newroomRequest, editroomRequest } from '../../reducers/reducerhotelPage'
// import { type ImagesRooms } from './types'
import Room from './Room'

export default ({ edit }: { edit: boolean }) => {
  // const navigate = useNavigate()
  // const dispatch = useAppDispatch()
  const { descriptionRooms, imagesRooms, roomsId } = useAppSelector(state => state.reducerhotelPage)

  // const [imagesRooms, setImagesRoom] = useState<ImagesRooms>(images)
  // const [descriptionRooms, setdescriptionRooms] = useState([...descriptions])
  // const [onOff, setOnOff] = useState([false, false])

  // useEffect(() => {
  //   setdescriptionRooms(descriptions)
  //   setImagesRoom(images)
  // }, [descriptions, images])

  // useEffect(() => {
  //   if (onOff.every((el) => el)) {
  //     navigate('/')
  //     navigate(`/allhotels/${id}`)
  //   }
  // }, [onOff, id, navigate])

  // const onImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
  //   const files = e.target.files
  //   if (files) {
  //     const [file1, file2] = Array.from(files) as [File, File | undefined]
  //     if (file1) {
  //       imagesRooms[type][0]
  //         ? setImagesRoom(prevState => ({ ...prevState, [type]: [imagesRooms[type][0], file1] }))
  //         : setImagesRoom(prevState => ({ ...prevState, [type]: [file1, null] }))
  //     }
  //     if (file2) {
  //       setImagesRoom(prevState => ({ ...prevState, [type]: [file1, file2] }))
  //     }
  //   }
  // }

  // const handlerClearForm = (type: string) => {
  //   setImagesRoom(prevState => ({ ...prevState, [type]: [null, null] }))
  //   setdescriptionRooms([type === 'standart' ? '' : descriptionRooms[0], type === 'lux' ? '' : descriptionRooms[1]])
  // }

  // const handlerCreateRoom = (type: string) => {
  //   if (imagesRooms[type][0] && imagesRooms[type][1]) {
  //     dispatch(newroomRequest({
  //       descriptionRoom: type === 'standart' ? descriptionRooms[0] : descriptionRooms[1],
  //       imagesRoom: imagesRooms[type],
  //       id
  //     }))
  //     setOnOff([type === 'standart' ? true : onOff[0], type === 'lux' ? true : onOff[1]])
  //   }
  // }

  // const handlerEditRoom = (type: string) => {
  //   if (imagesRooms[type][0] && imagesRooms[type][1] && roomsId[0] && roomsId[1]) {
  //     dispatch(editroomRequest({
  //       descriptionRoom: type === 'standart' ? descriptionRooms[0] : descriptionRooms[1],
  //       imagesRoom: [...imagesRooms[type]],
  //       roomId: type === 'standart' ? roomsId[0] : roomsId[1]
  //     }))
  //     setOnOff([type === 'standart' ? true : onOff[0], type === 'lux' ? true : onOff[1]])
  //   }
  // }

  // const putImage = (type: string, index: number) => {
  //   const image = imagesRooms[type][index]
  //   if (!image) {
  //     return ''
  //   }
  //   return typeof image === 'string' ? `data:'image/jpg';base64,${image}` : URL.createObjectURL(image)
  // }

  return (
    <>
    <Room type='standart' images={imagesRooms.standart} description={descriptionRooms.standart} roomId={roomsId.standart} edit={edit}/>
    <Room type='lux' images={imagesRooms.lux} description={descriptionRooms.lux} roomId={roomsId.lux} edit={edit}/>
    {/* <Room type='lux'/> */}
{/*      <section className="flex-col">
        <div className="flex">
          <img className="w-64 h-52 m-5 rounded-lg" alt={'Спальня в стандартном номере'} src={putImage('standart', 0)}/>
          <img className="w-64 h-52 m-5 rounded-lg" alt={'Санузел в стандартном номере'} src={putImage('standart', 1)}/>
          <input type="file" onChange={(e) => { onImageChange(e, 'standart') }} style={{ width: 96, height: 64, padding: 0 }}
            className="self-center before:content-[''] before:absolute before:bg-plus before:bg-no-repeat before:bg-center before:w-24 before:h-16
            before:bg-slate-300" multiple/>
        </div>
        <h3 className="ml-2.5 my-5">Стандартный номер</h3>
        <label>Описание отеля</label>
        <textarea style={{ height: 80 }} value={descriptionRooms[0]} onChange={(e) => { setdescriptionRooms([e.target.value, descriptionRooms[1]]) }}></textarea>
        <div className="flex">
          <button style={{ background: '#E15D5D' }} onClick={() => { handlerClearForm('standart') }}>Очистить</button>
          {!edit && !onOff[0] && <button style={{ background: '#1AA053' }} onClick={() => { handlerCreateRoom('standart') }}>Сохранить</button>}
          {edit && !onOff[0] && <button style={{ background: '#1AA053' }} onClick={() => { handlerEditRoom('standart') }}>Отредактировать</button>}
        </div>
      </section>
      <section className="flex-col">
        <div className="flex">
          <img className="w-64 h-52 m-5 rounded-lg" alt={'Спальня в люксе'} src={putImage('lux', 0)}/>
          <img className="w-64 h-52 m-5 rounded-lg" alt={'Санузел в люксе'} src={putImage('lux', 1)}/>
          <input type="file" onChange={(e) => { onImageChange(e, 'lux') }} style={{ width: 96, height: 64, padding: 0 }}
            className="self-center before:content-[''] before:absolute before:bg-plus before:bg-no-repeat before:bg-center before:w-24 before:h-16
            before:bg-slate-300" multiple/>
        </div>
        <h3 className="ml-2.5 my-5">Люкс</h3>
        <label>Описание отеля</label>
        <textarea style={{ height: 80 }} value={descriptionRooms[1]} onChange={(e) => { setdescriptionRooms([descriptionRooms[0], e.target.value]) }}></textarea>
        <div className="flex">
          <button style={{ background: '#E15D5D' }} onClick={() => { handlerClearForm('lux') }}>Очистить</button>
          {!edit && !onOff[1] && <button style={{ background: '#1AA053' }} onClick={() => { handlerCreateRoom('lux') }}>Сохранить</button>}
          {edit && !onOff[1] && <button style={{ background: '#1AA053' }} onClick={() => { handlerEditRoom('lux') }}>Отредактировать</button>}
        </div>
      </section> */}
    </>
  )
}
