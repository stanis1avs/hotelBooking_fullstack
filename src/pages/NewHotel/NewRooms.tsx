import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { useNavigate } from "react-router-dom";
import { newroomRequest, editroomRequest } from "../../reducers/reducerhotelPage";
import { ImagesRooms } from "./types";

export default ({edit}: {edit: boolean}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch()
  const { id, roomsId, descriptionRooms: descriptions, imagesRooms: images } = useAppSelector(state => state.reducerhotelPage)

  const [imagesRooms, setImagesRoom] = useState<ImagesRooms>(images)
  const [descriptionRooms, setdescriptionRooms] = useState([...descriptions])
  const [onOff, setOnOff] = useState([false, false])

  useEffect(() => {
    setdescriptionRooms(descriptions)
    setImagesRoom(images)
  }, [descriptions, images]);

  useEffect(() => {
    if (onOff.every((el) => el)) {
      navigate("/")
      navigate(`/allhotels/${id}`)
    }
  }, [onOff, id, navigate])


  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files
    if(files){
      const [file1, file2] = Array.from(files) as [File, File | undefined];
      if (file1) {
        imagesRooms[type][0]
        ? setImagesRoom(prevState => ({...prevState, [type]: [imagesRooms[type][0], file1]}))
        : setImagesRoom(prevState => ({...prevState, [type]: [file1, null]}));
      }
      if (file2) {
        setImagesRoom(prevState => ({...prevState, [type]: [file1, file2]}));
      }
    }
  }


  const handlerClearForm = (type: string) => {
    setImagesRoom(prevState => ({...prevState, [type]: [null, null]}))
    setdescriptionRooms([type === 'standart' ? '' : descriptionRooms[0], type === 'lux' ? '' : descriptionRooms[1]])
  }


  const handlerCreateRoom = (type: string) => {
    if(imagesRooms[type][0] && imagesRooms[type][1]){
      dispatch(newroomRequest({
        descriptionRoom: type === 'standart' ? descriptionRooms[0] : descriptionRooms[1],
        imagesRoom: imagesRooms[type],
        id
      }))
      setOnOff([type === 'standart' ? true : onOff[0], type === 'lux' ? true : onOff[1]])
    }
  }

  const handlerEditRoom = (type: string) => {
    if(imagesRooms[type][0] && imagesRooms[type][1] && roomsId[0] && roomsId[1]){
      dispatch(editroomRequest({
        descriptionRoom: type === 'standart' ? descriptionRooms[0] : descriptionRooms[1],
        imagesRoom: [...imagesRooms[type]],
        roomId: type === 'standart' ? roomsId[0] : roomsId[1],
      }));
      setOnOff([type === 'standart' ? true : onOff[0], type === 'lux' ? true : onOff[1]])
    }
  }

  return (
    <>
      <section className="flex-col">
        <div className="flex">
          <img className="w-64 h-52 m-5 rounded-lg" alt={"Спальня в стандартном номере"}
          src={!imagesRooms.standart[0] ? '' : typeof imagesRooms.standart[0] == 'string' ? `data:'image/jpg';base64,${imagesRooms.standart[0]}` : URL.createObjectURL(imagesRooms.standart[0])}/>
          <img className="w-64 h-52 m-5 rounded-lg" alt={"Санузел в стандартном номере"}
          src={!imagesRooms.standart[1] ? '' : typeof imagesRooms.standart[1] == 'string' ? `data:'image/jpg';base64,${imagesRooms.standart[1]}` : URL.createObjectURL(imagesRooms.standart[1])}/>
          <input type="file" onChange={(e) => onImageChange(e, 'standart')} style={{width: 96, height: 64, padding: 0}}
            className="self-center before:content-[''] before:absolute before:bg-plus before:bg-no-repeat before:bg-center before:w-24 before:h-16
            before:bg-slate-300" multiple/>
        </div>
        <h3 className="ml-2.5 my-5">Стандартный номер</h3>
        <label>Описание отеля</label>
        <textarea style={{height: 80}} value={descriptionRooms[0]} onChange={(e) => setdescriptionRooms([e.target.value, descriptionRooms[1]])}></textarea>
        <div className="flex">
          <button style={{background: "#E15D5D"}} onClick={() => handlerClearForm('standart')}>Очистить</button>
          {!edit && !onOff[0] && <button style={{background: "#1AA053"}} onClick={() => handlerCreateRoom('standart')}>Сохранить</button>}
          {edit && !onOff[0] && <button style={{background: "#1AA053"}} onClick={() => handlerEditRoom('standart')}>Отредактировать</button>}
        </div>
      </section>
      <section className="flex-col">
        <div className="flex">
          <img className="w-64 h-52 m-5 rounded-lg" alt={"Спальня в люксе"}
          src={!imagesRooms.lux[0] ? '' : typeof imagesRooms.lux[0] == 'string' ? `data:'image/jpg';base64,${imagesRooms.lux[0]}` : URL.createObjectURL(imagesRooms.lux[0])}/>
          <img className="w-64 h-52 m-5 rounded-lg" alt={"Санузел в люксе"}
          src={!imagesRooms.lux[1] ? '' : typeof imagesRooms.lux[1] == 'string' ? `data:'image/jpg';base64,${imagesRooms.lux[1]}` : URL.createObjectURL(imagesRooms.lux[1])}/>
          <input type="file" onChange={(e) => onImageChange(e, 'lux')} style={{width: 96, height: 64, padding: 0}}
            className="self-center before:content-[''] before:absolute before:bg-plus before:bg-no-repeat before:bg-center before:w-24 before:h-16
            before:bg-slate-300" multiple/>
        </div>
        <h3 className="ml-2.5 my-5">Люкс</h3>
        <label>Описание отеля</label>
        <textarea style={{height: 80}} value={descriptionRooms[1]} onChange={(e) => setdescriptionRooms([descriptionRooms[0], e.target.value])}></textarea>
        <div className="flex">
          <button style={{background: "#E15D5D"}} onClick={() => handlerClearForm('lux')}>Очистить</button>
          {!edit && !onOff[1] && <button style={{background: "#1AA053"}} onClick={() => handlerCreateRoom('lux')}>Сохранить</button>}
          {edit && !onOff[1] && <button style={{background: "#1AA053"}} onClick={() => handlerEditRoom('lux')}>Отредактировать</button>}
        </div>
      </section>
    </>
  );
}