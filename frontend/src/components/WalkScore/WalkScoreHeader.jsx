// 위치 아이콘
import locationIcon from '../../assets/locationIcon.png'


function WalkScoreHeader({ title, desc }) {
  return (
    <div className="flex flex-col items-start justify-between mb-6">
      
      <div className='flex items-center gap-2'>
        <img src={locationIcon} className='w-4 h-4' />
        <span className="text-[14px] text-txtcolor-500 font-bold">
          무슨시 무슨구
        </span>
      </div>

      <div className='mt-2'>
        <h2 className="text-[32px] font-bold">
          {title}
        </h2>
        <p className="text-[14px] text-txtcolor-500 mt-1">
          {desc}
        </p>
      </div>

    </div>
  )
}
export default WalkScoreHeader