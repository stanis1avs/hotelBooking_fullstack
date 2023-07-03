import { useNavigate } from "react-router-dom";

export default () => {
  const navigate = useNavigate();

  return (
    <div className="w-64 h-20 pt-6 mb-10 rounded-r-lg text-center cursor-pointer" style={{background: 'white'}} onClick={() => navigate('/')}>logo</div>
  )
}