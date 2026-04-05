import SupportChat from '../SupportChat/SupportChat'

export default ({ visibility }: { visibility: boolean }) => {
  return (
    <>
      {visibility &&
      <aside className='fixed justify-between flex-col right-0 bottom-0 bg-white flex'>
        <SupportChat/>
      </aside>
      }
    </>
  )
}
